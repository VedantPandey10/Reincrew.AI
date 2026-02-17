
export interface Candidate {
  name: string;
  position?: string;
  company?: string;
  accessId?: string;
  jobPostId?: string;

  // Identity Verification Fields
  email?: string;
  phone?: string;
  idNumber?: string;
  profilePhoto?: string;
  idCardImage?: string;
  isVerified?: boolean;
}

export interface Question {
  id: number;
  text: string;
  topic?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  referenceAnswer?: string; // HR's ideal answer
  keyPoints?: string[]; // Specific concepts to hit
  maxScore?: number; // Default 10
}

export interface RoleSettings {
  difficulty: 'Very Easy' | 'Easy' | 'Medium' | 'Hard' | 'Very Hard';
  preset: 'Relaxed' | 'Normal' | 'Strict' | 'Custom';
  weights: {
    concept: number;   // 0-100
    grammar: number;   // 0-100
    fluency: number;   // 0-100
    camera: number;    // 0-100
  };
  proctoring: {
    maxWarnings: number; // 1-5
    sensitivity: 'Low' | 'Medium' | 'High';
    includeInScore: boolean;
  };
}

export interface JobPost {
  id: string;
  title: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE';
  questions: Question[];
  settings: RoleSettings;
}

export interface EvaluationResult {
  questionId: number;
  questionText: string;
  userAnswer: string;

  // Granular Scoring
  contentScore: number; // Concept
  grammarScore: number;
  fluencyScore: number;
  communicationScore?: number;

  // Qualitative Analysis
  matchedKeyPoints: string[];
  missingKeyPoints: string[];
  verdict: 'Pass' | 'Borderline' | 'Fail';
  feedback: string;

  // Visual/Legacy
  confidenceScore: number; // 0-100 (Visual)
  expressionAnalysis: string; // Summary of visual analysis
  timestamp: string;
}

export interface WarningEvent {
  timestamp: string;
  type: 'GAZE' | 'FACE_MISSING' | 'MULTIPLE_FACES' | 'TAB_SWITCH' | 'FULLSCREEN_EXIT';
  message: string;
}

export interface InterviewSession {
  id: string;
  candidate: Candidate;
  date: string;
  status: 'COMPLETED' | 'TERMINATED' | 'IN_PROGRESS';
  overallScore: number; // 0-100
  results: EvaluationResult[];
  warnings: WarningEvent[];
  durationSeconds: number;
}

export interface AdminConfig {
  eyeTrackingSensitivity: number;
  warningThreshold: number;
  aiStrictness: number;
}

export enum InterviewStatus {
  IDLE = 'IDLE',
  LOADING_QUESTION = 'LOADING_QUESTION',
  ASKING = 'ASKING', // TTS playing
  LISTENING = 'LISTENING', // Mic active
  THINKING = 'THINKING', // AI evaluating
  FEEDBACK = 'FEEDBACK', // Showing result
  COMPLETED = 'COMPLETED',
  LOCKED = 'LOCKED'
}

export interface SpeechState {
  isListening: boolean;
  transcript: string;
  isSupported: boolean;
}

export interface VisualMetrics {
  isPresent: boolean;
  isLookingAtCamera: boolean;
  currentExpression: string;
  confidenceLevel: number;

  // Enhanced Malpractice Detection
  headPose: 'FORWARD' | 'DOWN' | 'LEFT' | 'RIGHT' | 'UP';
  isLookingDown: boolean;       // Eyes pointing downward (reading phone/notes)
  isTalking: boolean;           // Lips moving (possible whispering to someone)
  suspectedPhoneUse: boolean;   // Composite: head down + eyes down
  suspicionLevel: number;       // 0-100 overall suspicion score
}