export interface Variable {
  id: string;
  name: string;
  type: 'scale' | 'binary' | 'numeric';
  color: string;
  hypothesisId: string;
  isControl?: boolean; // Control variables vs primary variables
  promptTime?: 'morning' | 'midday' | 'evening' | 'anytime';
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
}

export interface DataPoint {
  id: string;
  variableId: string;
  value: number;
  date: string;
  note?: string;
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

