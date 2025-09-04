import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LocalUser, StudentProfile, ProfessionalProfile, CareerAnalysis, AppSettings } from './db';

// Auth Store
interface AuthState {
  currentUser: LocalUser | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  setCurrentUser: (user: LocalUser | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      currentUser: null,
      isAuthenticated: false,
      isGuest: false,
      setCurrentUser: (user) => set({ 
        currentUser: user, 
        isAuthenticated: !!user,
        isGuest: user?.isGuest || false 
      }),
      logout: () => set({ 
        currentUser: null, 
        isAuthenticated: false, 
        isGuest: false 
      }),
    }),
    {
      name: 'skilllead-auth',
      partialize: (state) => ({ 
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
        isGuest: state.isGuest
      }),
    }
  )
);

// Profile Store
interface ProfileState {
  profile: StudentProfile | ProfessionalProfile | null;
  profileType: 'student' | 'professional' | null;
  isLoading: boolean;
  hasUnsavedChanges: boolean;
  setProfile: (profile: StudentProfile | ProfessionalProfile, type: 'student' | 'professional') => void;
  updateProfile: (updates: Partial<StudentProfile & ProfessionalProfile>) => void;
  setLoading: (loading: boolean) => void;
  setUnsavedChanges: (hasChanges: boolean) => void;
  clearProfile: () => void;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  profileType: null,
  isLoading: false,
  hasUnsavedChanges: false,
  setProfile: (profile, type) => set({ 
    profile, 
    profileType: type,
    hasUnsavedChanges: false 
  }),
  updateProfile: (updates) => {
    const currentProfile = get().profile;
    if (currentProfile) {
      set({ 
        profile: { ...currentProfile, ...updates } as StudentProfile | ProfessionalProfile,
        hasUnsavedChanges: true 
      });
    }
  },
  setLoading: (loading) => set({ isLoading: loading }),
  setUnsavedChanges: (hasChanges) => set({ hasUnsavedChanges: hasChanges }),
  clearProfile: () => set({ 
    profile: null, 
    profileType: null, 
    hasUnsavedChanges: false 
  }),
}));

// Analysis Store
interface AnalysisState {
  analysis: CareerAnalysis | null;
  isAnalyzing: boolean;
  analysisStep: 'idle' | 'understanding' | 'clarifying' | 'exploring' | 'planning' | 'deep-dive' | 'complete';
  progress: number;
  setAnalysis: (analysis: CareerAnalysis | null) => void;
  setAnalyzing: (analyzing: boolean) => void;
  setAnalysisStep: (step: AnalysisState['analysisStep']) => void;
  setProgress: (progress: number) => void;
  clearAnalysis: () => void;
}

export const useAnalysisStore = create<AnalysisState>((set) => ({
  analysis: null,
  isAnalyzing: false,
  analysisStep: 'idle',
  progress: 0,
  setAnalysis: (analysis) => set({ analysis }),
  setAnalyzing: (analyzing) => set({ isAnalyzing: analyzing }),
  setAnalysisStep: (step) => set({ analysisStep: step }),
  setProgress: (progress) => set({ progress }),
  clearAnalysis: () => set({ 
    analysis: null, 
    isAnalyzing: false, 
    analysisStep: 'idle', 
    progress: 0 
  }),
}));

// Settings Store
interface SettingsState {
  settings: AppSettings | null;
  openaiKey: string;
  isKeyValid: boolean;
  animationsEnabled: boolean;
  setSettings: (settings: AppSettings) => void;
  setOpenaiKey: (key: string) => void;
  setKeyValid: (valid: boolean) => void;
  toggleAnimations: () => void;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      settings: null,
      openaiKey: '',
      isKeyValid: false,
      animationsEnabled: true,
      setSettings: (settings) => set({ settings }),
      setOpenaiKey: (key) => set({ openaiKey: key }),
      setKeyValid: (valid) => set({ isKeyValid: valid }),
      toggleAnimations: () => set({ animationsEnabled: !get().animationsEnabled }),
      updateSetting: (key, value) => {
        const current = get().settings;
        if (current) {
          set({ 
            settings: { ...current, [key]: value, updatedAt: new Date() }
          });
        }
      },
    }),
    {
      name: 'skilllead-settings',
      partialize: (state) => ({ 
        animationsEnabled: state.animationsEnabled,
        // Don't persist API key - it's stored separately for security
      }),
    }
  )
);

// Chat Store
interface ChatState {
  currentThreadId: number | null;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    isStreaming?: boolean;
  }>;
  isStreaming: boolean;
  setCurrentThread: (threadId: number | null) => void;
  addMessage: (message: Omit<ChatState['messages'][0], 'id' | 'timestamp'>) => void;
  updateLastMessage: (content: string) => void;
  setStreaming: (streaming: boolean) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  currentThreadId: null,
  messages: [],
  isStreaming: false,
  setCurrentThread: (threadId) => set({ currentThreadId: threadId }),
  addMessage: (message) => {
    const id = `msg-${Date.now()}-${Math.random()}`;
    const timestamp = new Date();
    set({ 
      messages: [...get().messages, { ...message, id, timestamp }]
    });
  },
  updateLastMessage: (content) => {
    const messages = get().messages;
    if (messages.length > 0) {
      const lastMessage = { ...messages[messages.length - 1] };
      lastMessage.content = content;
      set({ 
        messages: [...messages.slice(0, -1), lastMessage]
      });
    }
  },
  setStreaming: (streaming) => set({ isStreaming: streaming }),
  clearMessages: () => set({ messages: [] }),
}));

// UI Store for global UI state
interface UIState {
  sidebarOpen: boolean;
  currentPage: string;
  breadcrumbs: Array<{ label: string; href?: string }>;
  loading: boolean;
  setSidebarOpen: (open: boolean) => void;
  setCurrentPage: (page: string) => void;
  setBreadcrumbs: (breadcrumbs: UIState['breadcrumbs']) => void;
  setLoading: (loading: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  currentPage: '',
  breadcrumbs: [],
  loading: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setCurrentPage: (page) => set({ currentPage: page }),
  setBreadcrumbs: (breadcrumbs) => set({ breadcrumbs }),
  setLoading: (loading) => set({ loading }),
}));