import { useSettingsStore } from './stores';
import type { StudentProfile, ProfessionalProfile } from './db';

// OpenAI API Configuration
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4-turbo-preview';

// System prompts
export const ANALYSIS_SYSTEM_PROMPT = `You are SkillLead.AI, a career guidance expert. Your role is to:

1. Validate and clarify user-supplied profile data with targeted follow-up questions when needed; otherwise proceed.
2. Identify the user's interests and constraints (time, budget, location, remote/on-site, visa, learning style).
3. Analyze strengths, gaps, and context (student vs professional).
4. Generate diverse opportunity sets, not biased to highest-paying only.
5. Output three plans: Plan A (Primary), Plan B, Plan C; choose Plan A as best fit to constraints/interests.
6. Deep dive on Plan A: impact, scope, future demand, market outlook, geo notes, competencies, certifications, tools, portfolio, risks/mitigations, milestone timeline (0–3, 3–6, 6–12 months).
7. Provide a concise summary and an actionable roadmap with skills, courses/resources, and best places to learn tailored to the user.

Be clear, structured, and step-by-step. Ask follow-ups when uncertain. Return your response as a structured JSON object.`;

export const CHAT_SYSTEM_PROMPT = `You are the SkillLead.AI assistant. Maintain context from this user's saved analysis.

Key guidelines:
- Clarify doubts, give concrete examples, and explain simply
- Revise plans per user requests (timeline, budget, remote, region)
- Keep responses concise, structured, and practical
- Ask precise follow-ups when uncertain
- Never fabricate user data; only use the profile, saved analysis, and chat history
- Focus on actionable advice and career guidance`;

// Types
export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenAIStreamResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role?: string;
      content?: string;
    };
    finish_reason: string | null;
  }>;
}

// API Key management
export const getApiKey = (): string | null => {
  // First check session storage
  const sessionKey = sessionStorage.getItem('openai-api-key');
  if (sessionKey) return sessionKey;

  // Then check if user has encrypted local storage enabled
  const { settings } = useSettingsStore.getState();
  if (settings?.openaiKeyStored === 'encrypted_local') {
    const encryptedKey = localStorage.getItem('openai-api-key-encrypted');
    if (encryptedKey) {
      // TODO: Implement decryption with user passphrase
      return null; // For now, return null until decryption is implemented
    }
  }

  return null;
};

export const setApiKey = (key: string, persistent = false) => {
  if (persistent) {
    // Store in localStorage with encryption (TODO: implement encryption)
    localStorage.setItem('openai-api-key-encrypted', key);
    useSettingsStore.getState().updateSetting('openaiKeyStored', 'encrypted_local');
  } else {
    // Store in sessionStorage (cleared when browser closes)
    sessionStorage.setItem('openai-api-key', key);
    useSettingsStore.getState().updateSetting('openaiKeyStored', 'session');
  }
  
  useSettingsStore.getState().setOpenaiKey(key);
};

export const clearApiKey = () => {
  sessionStorage.removeItem('openai-api-key');
  localStorage.removeItem('openai-api-key-encrypted');
  useSettingsStore.getState().setOpenaiKey('');
  useSettingsStore.getState().setKeyValid(false);
  useSettingsStore.getState().updateSetting('openaiKeyStored', 'none');
};

// Test API key validity
export const testApiKey = async (key: string): Promise<boolean> => {
  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: 'Test' }],
        max_tokens: 5,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('API key test failed:', error);
    return false;
  }
};

// Make OpenAI API call
export const callOpenAI = async (
  messages: OpenAIMessage[],
  stream = false,
  onStream?: (content: string) => void
): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('OpenAI API key not found. Please configure your API key in Settings.');
  }

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      stream,
      temperature: 0.7,
      max_tokens: stream ? 2000 : 4000,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
    throw new Error(`OpenAI API error: ${error.error?.message || 'Request failed'}`);
  }

  if (stream && response.body) {
    return handleStreamResponse(response.body, onStream);
  } else {
    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }
};

// Handle streaming response
const handleStreamResponse = async (
  body: ReadableStream<Uint8Array>,
  onStream?: (content: string) => void
): Promise<string> => {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let fullContent = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim() !== '');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed: OpenAIStreamResponse = JSON.parse(data);
            const content = parsed.choices[0]?.delta?.content || '';
            if (content) {
              fullContent += content;
              onStream?.(fullContent);
            }
          } catch (e) {
            // Skip invalid JSON lines
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  return fullContent;
};

// Generate career analysis
export const generateCareerAnalysis = async (
  profile: StudentProfile | ProfessionalProfile,
  profileType: 'student' | 'professional',
  onProgress?: (step: string, progress: number) => void
): Promise<any> => {
  const messages: OpenAIMessage[] = [
    { role: 'system', content: ANALYSIS_SYSTEM_PROMPT },
    { 
      role: 'user', 
      content: `Please analyze my ${profileType} profile and provide career guidance:

Profile Type: ${profileType}
Profile Data: ${JSON.stringify(profile, null, 2)}

Please provide a comprehensive analysis with three career plans (A, B, C) and deep dive into Plan A. Return the result as a structured JSON object matching the CareerAnalysis interface.`
    }
  ];

  onProgress?.('Analyzing your profile...', 25);
  
  try {
    const response = await callOpenAI(messages, false);
    onProgress?.('Processing recommendations...', 75);
    
    // Parse the JSON response
    const analysisData = JSON.parse(response);
    onProgress?.('Complete!', 100);
    
    return analysisData;
  } catch (error) {
    console.error('Analysis generation failed:', error);
    throw error;
  }
};

// Chat with assistant
export const chatWithAssistant = async (
  message: string,
  context: {
    profile: StudentProfile | ProfessionalProfile;
    analysis?: any;
    chatHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  },
  onStream?: (content: string) => void
): Promise<string> => {
  const messages: OpenAIMessage[] = [
    { role: 'system', content: CHAT_SYSTEM_PROMPT },
    { 
      role: 'system', 
      content: `User's profile: ${JSON.stringify(context.profile, null, 2)}${
        context.analysis ? `\nUser's career analysis: ${JSON.stringify(context.analysis, null, 2)}` : ''
      }` 
    },
    ...context.chatHistory.map(msg => ({ 
      role: msg.role as 'user' | 'assistant', 
      content: msg.content 
    })),
    { role: 'user', content: message }
  ];

  return await callOpenAI(messages, true, onStream);
};

// Demo mode - returns mock data without API calls
export const mockAnalysisData = {
  status: 'complete',
  clarifications: [],
  interestsConfirmed: true,
  plans: {
    A: {
      title: 'Full-Stack Developer',
      rationale: 'Perfect blend of your technical skills and learning preferences',
      fitScore: 95,
      roles: ['Frontend Developer', 'Backend Developer', 'Full-Stack Engineer'],
      industries: ['Technology', 'Fintech', 'E-commerce'],
      riskFactors: ['High competition', 'Rapid technology changes'],
      mitigations: ['Continuous learning', 'Building strong portfolio']
    },
    B: {
      title: 'Data Analyst',
      rationale: 'Leverages analytical skills with moderate learning curve'
    },
    C: {
      title: 'Product Manager',
      rationale: 'Combines technical background with business strategy'
    }
  },
  planADeepDive: {
    impact: 'High demand role with excellent growth potential',
    scope: 'End-to-end web application development',
    futureDemand: 'Growing 22% through 2030',
    marketOutlook: 'Excellent opportunities in tech hubs and remote',
    geoNotes: 'Strong demand in SF, NYC, Austin, and remote positions',
    competencies: {
      core: ['React', 'Node.js', 'Database Design', 'API Development'],
      supporting: ['DevOps', 'Testing', 'UI/UX Principles'],
      certifications: ['AWS Developer', 'React Certification']
    },
    toolsStack: ['React', 'Node.js', 'PostgreSQL', 'Docker', 'AWS'],
    portfolio: {
      suggestedProjects: [
        'E-commerce platform with payment integration',
        'Social media dashboard with real-time updates',
        'Task management app with team collaboration'
      ]
    },
    timeline: {
      month0_3: ['Master React fundamentals', 'Build first full-stack project', 'Learn database basics'],
      month3_6: ['Advanced React patterns', 'API design', 'Deploy to cloud'],
      month6_12: ['System design', 'Performance optimization', 'Team collaboration tools']
    },
    risks: ['Technology changes rapidly', 'High competition for entry-level roles']
  },
  summary: 'Full-stack development offers excellent career prospects with your background.',
  roadmap: {
    skillsToLearn: [
      { name: 'React', level: 'Advanced' },
      { name: 'Node.js', level: 'Intermediate' },
      { name: 'PostgreSQL', level: 'Intermediate' }
    ],
    coursesAndResources: [
      { name: 'React Complete Guide', provider: 'Udemy', type: 'Course', reason: 'Comprehensive React training' },
      { name: 'Node.js Masterclass', provider: 'FreeCodeCamp', type: 'Free Course', reason: 'Backend development skills' }
    ],
    communitiesAndEvents: ['React Meetups', 'Developer Twitter', 'Stack Overflow'],
    interviewPrepTopics: ['System Design', 'Data Structures', 'React Patterns'],
    nextActions: ['Set up development environment', 'Start first project', 'Join developer community']
  }
};