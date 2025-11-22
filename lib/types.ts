export interface Variable {
  id: string;
  name: string;
  type: 'scale' | 'binary' | 'numeric';
  color: string;
  hypothesisId: string;
  isControl?: boolean; // Control variables vs primary variables
  promptTime?: 'morning' | 'midday' | 'evening' | 'anytime';
  dataSourceId?: string; // ID of connected app/device that auto-updates this variable
}

export interface ParsedHypothesis {
  intervention: string;
  outcome: string;
  category: 'cognitive' | 'physical' | 'emotional' | 'behavioral' | 'sleep' | 'nutrition' | 'general';
  confidence: number; // 0-1 how confident the parse is
}

export interface KnowledgeCard {
  intervention: string;
  backgroundInfo: string[];
  evidenceSummary: string;
  typicalDosage?: string;
  timing?: string;
  sources?: string[];
  relatedControls: string[];
}

export interface Hypothesis {
  id: string;
  question: string;
  variables: Variable[];
  createdAt: string;
  archived: boolean;
  status?: 'active' | 'concluded'; // Experiment status
  parsed?: ParsedHypothesis;
  knowledgeCard?: KnowledgeCard;
  baselinePhase?: {
    startDate: string;
    endDate: string;
    completed: boolean;
  };
  interventionStartDate?: string;
  context?: {
    frequency?: string;
    timing?: string;
    specificContext?: string;
  };
  conversationId?: string; // Link to the conversation that created this hypothesis
  conclusion?: {
    verdict: 'supported' | 'rejected' | 'inconclusive';
    summary: string;
    concludedAt: string;
  };
}

export interface DataPoint {
  id: string;
  variableId: string;
  value: number;
  date: string;
  note?: string;
  metadata?: {
    // For exercise tracking
    exerciseType?: string;
    duration?: number; // in minutes
    distance?: number; // in miles or km
    // For hydration tracking
    amount?: number; // in oz
    unit?: 'glass' | 'oz' | 'mug' | 'bottle';
    // For sleep tracking
    sleepQuality?: number; // 1-10
    sleepDuration?: number; // in hours
    // For nutrition tracking
    mealType?: string;
    timeOfDay?: string;
    calories?: number;
    ingredients?: string;
  };
}

export interface Insight {
  id: string;
  text: string;
  type: 'pattern' | 'correlation' | 'streak' | 'general';
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  title: string; // First user message or hypothesis text
  messages: ChatMessage[];
  state: {
    hypothesisText: string;
    parsed?: ParsedHypothesis;
    knowledgeCard?: KnowledgeCard;
    outcomeContext?: string;
    frequency?: string;
    timing?: string;
    wantsBaseline: boolean;
    baselineDays: number;
    selectedControls: string[];
    suggestedControls: string[];
    currentQuestionIndex: number;
    clarifyingQuestions: string[];
    step: string;
    knowledgeCardAfterMessageId?: string | null;
    showSummary?: boolean;
    summaryMessageId?: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

export type ProfileCategory = 'age' | 'gender' | 'height' | 'weight' | 'diet' | 'race' | 'allergies' | 'medications' | 'medicalConditions';

export interface UserProfile {
  id: string;
  name: string;
  profilePicture?: string; // URL or base64
  height?: number; // in cm
  weight?: number; // in kg
  age?: number;
  gender?: string;
  diet?: string;
  race?: string;
  allergies?: string;
  medications?: string;
  medicalConditions?: string;
  enabledCategories: ProfileCategory[]; // Categories enabled on profile
  visibilitySettings: {
    name?: boolean;
    age?: boolean;
    height?: boolean;
    weight?: boolean;
    gender?: boolean;
    diet?: boolean;
    race?: boolean;
    allergies?: boolean;
    medications?: boolean;
    medicalConditions?: boolean;
  }; // Which categories to show on profile (even if enabled)
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  notifications: {
    enabled: boolean;
    reminderTime?: string; // HH:mm format
    reminderDays?: number[]; // Array of day indices (0-6, Sunday-Saturday)
  };
  colorScheme: 'light' | 'dark';
  accentColor: 'teal' | 'red' | 'brown' | 'baby-blue' | 'black' | 'orange';
  units: 'metric' | 'imperial';
  dataPrivacy: {
    shareAnalytics: boolean;
    allowDataExport: boolean;
    autoBackup: boolean;
  };
  updatedAt: string;
}

export interface ConnectedApp {
  id: string;
  name: string;
  type: 'app';
  appType: 'fitness' | 'health' | 'nutrition' | 'wellness';
  icon?: string; // URL or emoji
  connectedAt: string;
  lastSync?: string;
  status: 'connected' | 'disconnected' | 'error';
}

export interface ConnectedDevice {
  id: string;
  name: string;
  type: 'device';
  deviceType: 'watch' | 'fitness_tracker' | 'scale' | 'heart_rate_monitor' | 'other';
  icon?: string; // URL or emoji
  connectedAt: string;
  lastSync?: string;
  status: 'connected' | 'disconnected' | 'error';
}

export type DataSource = ConnectedApp | ConnectedDevice;

