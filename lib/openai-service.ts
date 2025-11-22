import { ParsedHypothesis, KnowledgeCard } from './types';

// Client-side wrapper functions that call the server-side API route
// This keeps the API key secure on the server

// Parse hypothesis using GPT (via server-side API)
export async function parseHypothesisWithAI(hypothesisText: string): Promise<ParsedHypothesis> {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'parse',
        hypothesisText,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to parse hypothesis');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error parsing hypothesis:', error);
    throw error;
  }
}

// Generate knowledge card using GPT (via server-side API)
export async function generateKnowledgeCardWithAI(
  intervention: string,
  outcome: string,
  category: string
): Promise<KnowledgeCard> {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'knowledgeCard',
        intervention,
        outcome,
        category,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate knowledge card');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error generating knowledge card:', error);
    throw error;
  }
}

// Generate clarifying questions using GPT (via server-side API)
// Note: This function is kept for backward compatibility but may not be used
export async function generateClarifyingQuestionsWithAI(
  parsed: ParsedHypothesis
): Promise<string[]> {
  // This functionality is now handled by the chat endpoint
  // Return default questions as fallback
  return [
    `How would you specifically define "${parsed.outcome}" for your tracking?`,
    `How often will you do ${parsed.intervention}?`,
    `When during the day do you want to measure ${parsed.outcome}?`,
  ];
}

// Conversational AI chat function for natural hypothesis creation (via server-side API)
export async function chatWithAI(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  extractInfo: boolean = false
): Promise<{
  response: string;
  extractedInfo?: {
    intervention?: string;
    outcome?: string;
    category?: string;
    frequency?: string;
    timing?: string;
    outcomeContext?: string;
    wantsBaseline?: boolean;
    baselineDays?: number;
    selectedControls?: string[];
    isReadyToCreate?: boolean;
  };
}> {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'chat',
        messages,
        extractInfo,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get AI response');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error in chatWithAI:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to get AI response. Please check your API key configuration.');
  }
}

