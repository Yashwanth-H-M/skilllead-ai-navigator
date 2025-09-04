import Dexie, { Table } from 'dexie';

// Types for the database schema
export interface LocalUser {
  id?: number;
  name: string;
  role: 'student' | 'professional';
  createdAt: Date;
  updatedAt: Date;
  isGuest: boolean;
  passphraseProtected: boolean;
}

export interface StudentProfile {
  id?: number;
  userId: number;
  education: Array<{
    level: string;
    school: string;
    degree: string;
    major: string;
    graduationDate: string;
    gpa?: string;
  }>;
  projects: Array<{
    name: string;
    description: string;
    technologies: string[];
    url?: string;
  }>;
  internships: Array<{
    company: string;
    role: string;
    duration: string;
    description: string;
  }>;
  skills: Array<{
    name: string;
    level: 'Beginner' | 'Intermediate' | 'Advanced';
  }>;
  interests: string[];
  preferredLocations: string[];
  workAuthorization: string;
  preferences: ProfilePreferences;
  status: 'draft' | 'confirmed';
  updatedAt: Date;
}

export interface ProfessionalProfile {
  id?: number;
  userId: number;
  company: string;
  role: string;
  yearsExperience: number;
  domains: string[];
  projects: Array<{
    name: string;
    description: string;
    technologies: string[];
    impact: string;
  }>;
  stack: string[];
  certifications: string[];
  skills: Array<{
    name: string;
    level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  }>;
  desiredRoles: string[];
  salaryRange: {
    min: number;
    max: number;
    currency: string;
  };
  preferredLocations: string[];
  preferences: ProfilePreferences;
  status: 'draft' | 'confirmed';
  updatedAt: Date;
}

export interface ProfilePreferences {
  timeline: '3-months' | '6-months' | '12-months';
  budget: 'free' | 'budget-friendly' | 'premium';
  remote: boolean;
  relocation: boolean;
  learningStyle: 'self-paced' | 'structured' | 'mentored';
}

export interface CareerAnalysis {
  id?: number;
  userId: number;
  status: 'needs_clarification' | 'analyzing' | 'complete';
  clarifications: string[];
  interestsConfirmed: boolean;
  plans: {
    A: {
      title: string;
      rationale: string;
      fitScore: number;
      roles: string[];
      industries: string[];
      riskFactors: string[];
      mitigations: string[];
    };
    B: {
      title: string;
      rationale: string;
    };
    C: {
      title: string;
      rationale: string;
    };
  };
  planADeepDive: {
    impact: string;
    scope: string;
    futureDemand: string;
    marketOutlook: string;
    geoNotes: string;
    competencies: {
      core: string[];
      supporting: string[];
      certifications: string[];
    };
    toolsStack: string[];
    portfolio: {
      suggestedProjects: string[];
    };
    timeline: {
      month0_3: string[];
      month3_6: string[];
      month6_12: string[];
    };
    risks: string[];
  };
  summary: string;
  roadmap: {
    skillsToLearn: Array<{
      name: string;
      level: string;
    }>;
    coursesAndResources: Array<{
      name: string;
      provider: string;
      type: string;
      reason: string;
    }>;
    communitiesAndEvents: string[];
    interviewPrepTopics: string[];
    nextActions: string[];
  };
  latest: boolean;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

export interface ChatThread {
  id?: number;
  userId: number;
  title: string;
  createdAt: Date;
  contextRefs: string[];
}

export interface ChatMessage {
  id?: number;
  threadId: number;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
  tokens?: number;
  annotations?: Record<string, any>;
}

export interface AppSettings {
  id?: number;
  openaiKeyStored: 'session' | 'encrypted_local' | 'none';
  reduceMotion: boolean;
  theme: 'light' | 'dark' | 'system';
  locale: string;
  updatedAt: Date;
}

// Database class
export class SkillLeadDB extends Dexie {
  users!: Table<LocalUser>;
  studentProfiles!: Table<StudentProfile>;
  professionalProfiles!: Table<ProfessionalProfile>;
  analyses!: Table<CareerAnalysis>;
  chatThreads!: Table<ChatThread>;
  chatMessages!: Table<ChatMessage>;
  settings!: Table<AppSettings>;

  constructor() {
    super('SkillLeadDB');
    
    this.version(1).stores({
      users: '++id, name, role, createdAt, isGuest',
      studentProfiles: '++id, userId, status, updatedAt',
      professionalProfiles: '++id, userId, status, updatedAt',
      analyses: '++id, userId, latest, createdAt, version',
      chatThreads: '++id, userId, createdAt',
      chatMessages: '++id, threadId, role, createdAt',
      settings: '++id, updatedAt'
    });
  }
}

// Database instance
export const db = new SkillLeadDB();

// Helper functions
export const getUserById = async (id: number): Promise<LocalUser | undefined> => {
  return await db.users.get(id);
};

export const getCurrentUser = async (): Promise<LocalUser | undefined> => {
  const users = await db.users.orderBy('updatedAt').reverse().toArray();
  return users[0];
};

export const getProfileByUserId = async (userId: number, role: 'student' | 'professional') => {
  if (role === 'student') {
    return await db.studentProfiles.where('userId').equals(userId).first();
  } else {
    return await db.professionalProfiles.where('userId').equals(userId).first();
  }
};

export const getLatestAnalysis = async (userId: number): Promise<CareerAnalysis | undefined> => {
  return await db.analyses.where({ userId, latest: true }).first();
};

export const getChatThreads = async (userId: number): Promise<ChatThread[]> => {
  const threads = await db.chatThreads.where('userId').equals(userId).toArray();
  return threads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const getChatMessages = async (threadId: number): Promise<ChatMessage[]> => {
  const messages = await db.chatMessages.where('threadId').equals(threadId).toArray();
  return messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
};

export const getSettings = async (): Promise<AppSettings | undefined> => {
  const settings = await db.settings.toArray();
  return settings.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];
};

// Export all data for backup
export const exportAllData = async () => {
  const [users, studentProfiles, professionalProfiles, analyses, chatThreads, chatMessages, settings] = await Promise.all([
    db.users.toArray(),
    db.studentProfiles.toArray(),
    db.professionalProfiles.toArray(),
    db.analyses.toArray(),
    db.chatThreads.toArray(),
    db.chatMessages.toArray(),
    db.settings.toArray()
  ]);

  return {
    version: 1,
    exported: new Date().toISOString(),
    data: {
      users,
      studentProfiles,
      professionalProfiles,
      analyses,
      chatThreads,
      chatMessages,
      settings
    }
  };
};

// Import data from backup
export const importData = async (backupData: any) => {
  await db.transaction('rw', [db.users, db.studentProfiles, db.professionalProfiles, db.analyses, db.chatThreads, db.chatMessages, db.settings], async () => {
    // Clear existing data
    await Promise.all([
      db.users.clear(),
      db.studentProfiles.clear(),
      db.professionalProfiles.clear(),
      db.analyses.clear(),
      db.chatThreads.clear(),
      db.chatMessages.clear(),
      db.settings.clear()
    ]);

    // Import new data
    const { data } = backupData;
    await Promise.all([
      db.users.bulkAdd(data.users || []),
      db.studentProfiles.bulkAdd(data.studentProfiles || []),
      db.professionalProfiles.bulkAdd(data.professionalProfiles || []),
      db.analyses.bulkAdd(data.analyses || []),
      db.chatThreads.bulkAdd(data.chatThreads || []),
      db.chatMessages.bulkAdd(data.chatMessages || []),
      db.settings.bulkAdd(data.settings || [])
    ]);
  });
};