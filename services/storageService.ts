
import { InterviewSession, AdminConfig, EvaluationResult, Candidate, JobPost, Question, RoleSettings } from "../types";

const SESSIONS_KEY = 'reicrew_sessions_v2';
const CONFIG_KEY = 'reicrew_config_v2';
const JOBS_KEY = 'reicrew_jobs_v2';
const PROFILES_KEY = 'reicrew_profiles_v2';
const ADMINS_KEY = 'reicrew_admins_v2';

const DEFAULT_SETTINGS: RoleSettings = {
  difficulty: 'Medium',
  preset: 'Normal',
  weights: {
    concept: 50,
    grammar: 20,
    fluency: 20,
    camera: 10
  },
  proctoring: {
    maxWarnings: 3,
    sensitivity: 'Medium',
    includeInScore: true
  }
};

// Seed Data for Jobs with HR Reference Logic
const SEED_JOBS: JobPost[] = [
  {
    id: 'job-frontend',
    title: 'Senior Frontend Engineer',
    description: 'React, TypeScript, and Performance Optimization focus.',
    status: 'ACTIVE',
    settings: { ...DEFAULT_SETTINGS, difficulty: 'Hard', preset: 'Strict' },
    questions: [
      {
        id: 1,
        text: "Explain the concept of the Virtual DOM in React and how it improves performance.",
        difficulty: 'Medium',
        topic: 'React Internals',
        referenceAnswer: "The Virtual DOM is a lightweight in-memory representation of the real DOM. When state changes, React updates the Virtual DOM first, compares it with the previous version (diffing), and only updates the actual DOM nodes that changed (reconciliation). This minimizes slow browser layout reflows.",
        keyPoints: [
          "In-memory representation",
          "Diffing algorithm",
          "Reconciliation",
          "Minimizes reflows/repaints"
        ],
        maxScore: 10
      },
      {
        id: 2,
        text: "What is the difference between useMemo and useCallback?",
        difficulty: 'Easy',
        topic: 'React Hooks',
        referenceAnswer: "useMemo caches the *result* of a calculation between renders. useCallback caches the *function definition* itself. Both rely on a dependency array to invalidate the cache.",
        keyPoints: [
          "useMemo caches values",
          "useCallback caches functions",
          "Dependency array",
          "Referential equality"
        ],
        maxScore: 10
      },
      {
        id: 3,
        text: "How would you handle global state in a complex React application?",
        difficulty: 'Hard',
        topic: 'Architecture',
        referenceAnswer: "For complex apps, I separate server state (TanStack Query) from client state. For client state, I avoid Prop Drilling by using Context for static data (themes) and libraries like Zustand or Redux Toolkit for complex, frequent updates.",
        keyPoints: [
          "Server vs Client state separation",
          "Context API limitations",
          "Redux/Zustand for complex state",
          "Avoid prop drilling"
        ],
        maxScore: 10
      }
    ]
  },
  {
    id: 'job-backend',
    title: 'Backend API Developer',
    description: 'Node.js, Systems Design, and Database focus.',
    status: 'ACTIVE',
    settings: DEFAULT_SETTINGS,
    questions: [
      {
        id: 1,
        text: "Explain the Event Loop in Node.js.",
        difficulty: 'Hard',
        topic: 'Node Runtime',
        referenceAnswer: "Node.js is single-threaded but non-blocking. The Event Loop offloads I/O operations to the system kernel. When operations complete, their callbacks are queued in phases (timers, I/O, check/immediate, close).",
        keyPoints: [
          "Single-threaded",
          "Non-blocking I/O",
          "Phases (Timers, Poll, Check)",
          "Call stack vs Callback queue"
        ],
        maxScore: 10
      },
      {
        id: 2,
        text: "What are the ACID properties in databases?",
        difficulty: 'Medium',
        topic: 'Databases',
        referenceAnswer: "Atomicity (all or nothing), Consistency (valid state), Isolation (transactions don't interfere), and Durability (committed data survives failure).",
        keyPoints: [
          "Atomicity",
          "Consistency",
          "Isolation",
          "Durability"
        ],
        maxScore: 10
      }
    ]
  }
];

const DEFAULT_CONFIG: AdminConfig = {
  eyeTrackingSensitivity: 7,
  warningThreshold: 3,
  aiStrictness: 8
};

export const StorageService = {
  getSessions: (): InterviewSession[] => {
    const stored = localStorage.getItem(SESSIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  saveSession: (session: InterviewSession) => {
    const sessions = StorageService.getSessions();
    const updated = [session, ...sessions];
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(updated));
  },

  getConfig: (): AdminConfig => {
    const stored = localStorage.getItem(CONFIG_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_CONFIG;
  },

  saveConfig: (config: AdminConfig) => {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  },

  getJobs: (): JobPost[] => {
    const stored = localStorage.getItem(JOBS_KEY);
    if (!stored) {
      localStorage.setItem(JOBS_KEY, JSON.stringify(SEED_JOBS));
      return SEED_JOBS;
    }
    return JSON.parse(stored);
  },

  saveJobs: (jobs: JobPost[]) => {
    localStorage.setItem(JOBS_KEY, JSON.stringify(jobs));
  },

  getJobById: (id: string): JobPost | undefined => {
    return StorageService.getJobs().find(j => j.id === id);
  },

  // --- User Identity Caching ---

  getUserProfile: (accessId: string): Candidate | null => {
    try {
      const stored = localStorage.getItem(PROFILES_KEY);
      if (!stored) return null;
      const profiles = JSON.parse(stored);
      return profiles[accessId] || null;
    } catch (e) {
      return null;
    }
  },

  saveUserProfile: (candidate: Candidate) => {
    try {
      const stored = localStorage.getItem(PROFILES_KEY);
      const profiles = stored ? JSON.parse(stored) : {};
      profiles[candidate.accessId] = candidate;
      localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
    } catch (e) {
      console.error("Failed to save user profile", e);
    }
  },

  clearUserProfile: (accessId: string) => {
    try {
      const stored = localStorage.getItem(PROFILES_KEY);
      if (stored) {
        const profiles = JSON.parse(stored);
        delete profiles[accessId];
        localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
      }
    } catch (e) {
      console.error("Failed to clear user profile", e);
    }
  },

  // --- Admin Authentication ---

  getAdmins: (): Record<string, string> => {
    const stored = localStorage.getItem(ADMINS_KEY);
    return stored ? JSON.parse(stored) : { "admin": "admin123" }; // Default creds
  },

  registerAdmin: (username: string, password: string): boolean => {
    const admins = StorageService.getAdmins();
    if (admins[username]) return false;
    admins[username] = password;
    localStorage.setItem(ADMINS_KEY, JSON.stringify(admins));
    return true;
  },

  verifyAdmin: (username: string, password: string): boolean => {
    const admins = StorageService.getAdmins();
    return admins[username] === password;
  }
};
