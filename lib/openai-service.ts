import OpenAI from 'openai';
import { ParsedHypothesis, KnowledgeCard } from './types';

// Initialize OpenAI client (client-side)
let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openai) {
    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    if (!apiKey || apiKey === 'your-api-key-here') {
      throw new Error('OpenAI API key not configured. Please add NEXT_PUBLIC_OPENAI_API_KEY to .env file');
    }
    openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true,
    });
  }
  return openai;
}

// Parse hypothesis using GPT
export async function parseHypothesisWithAI(hypothesisText: string): Promise<ParsedHypothesis> {
  const client = getOpenAIClient();
  
  const prompt = `You are analyzing a personal health/wellness hypothesis. Extract key information from this question:

"${hypothesisText}"

Your task:
1. Identify the INTERVENTION (what the person is doing/taking/changing):
   - Examples: "running", "omega-3", "meditation", "cold showers", "journaling"
   - Be specific - extract the actual activity/supplement/behavior mentioned
   
2. Identify the OUTCOME (what they want to measure/improve):
   - Examples: "stress", "focus", "sleep quality", "mood", "energy"
   - Extract the specific thing they want to track or improve
   
3. Categorize into ONE of these:
   - "physical" - exercise, movement, physical activities
   - "emotional" - stress, mood, anxiety, happiness
   - "cognitive" - focus, memory, concentration, mental clarity
   - "sleep" - sleep quality, insomnia, rest
   - "nutrition" - diet, supplements, food intake
   - "behavioral" - habits, routines, practices
   
4. Confidence (0-1): How clear is the hypothesis?

Examples:
- "Does running reduce stress?" → intervention: "running", outcome: "stress", category: "physical"
- "Will omega-3 improve my focus?" → intervention: "omega-3", outcome: "focus", category: "nutrition"
- "Does meditation help with anxiety?" → intervention: "meditation", outcome: "anxiety", category: "behavioral"

Return ONLY valid JSON:
{
  "intervention": "specific intervention name",
  "outcome": "specific outcome being measured",
  "category": "one category from the list",
  "confidence": 0.9
}`;

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at analyzing personal hypotheses. Extract the specific intervention and outcome. Be precise and specific. Return valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0].message.content || '{}';
    const parsed = JSON.parse(content);
    
    console.log('AI Parsed:', parsed); // Debug log
    
    return {
      intervention: parsed.intervention || 'intervention',
      outcome: parsed.outcome || 'outcome',
      category: parsed.category || 'general',
      confidence: parsed.confidence || 0.8
    };
}

// Generate knowledge card using GPT
export async function generateKnowledgeCardWithAI(
  intervention: string,
  outcome: string,
  category: string
): Promise<KnowledgeCard> {
  const client = getOpenAIClient();
  
  const prompt = `Create a research-based knowledge card about using "${intervention}" to improve "${outcome}".

Provide comprehensive, evidence-based information:

1. backgroundInfo: Array of 3-4 scientific facts about how ${intervention} affects ${outcome}
   - Include physiological mechanisms if applicable
   - Mention relevant studies or scientific consensus
   - Keep each fact to 1-2 sentences

2. evidenceSummary: 2-3 sentences summarizing the research evidence
   - Be specific about effectiveness
   - Mention timeframes for seeing results
   - Note any important caveats

3. typicalDosage: Practical recommendation for frequency/amount/duration
   - For exercise: frequency and duration
   - For supplements: dosage range
   - For practices: time commitment
   - Set to null if not applicable

4. timing: When to do it for best results
   - Best time of day
   - Relation to meals, sleep, etc.
   - Set to null if timing doesn't matter

5. sources: 2-3 credible reference names (real or representative)
   - Format: "Journal Name - Study Topic" or "Institution - Finding"

6. relatedControls: 4-6 important variables to track alongside
   - Things that could confound results
   - Other factors that influence the outcome
   - Be specific to this intervention and outcome

Return valid JSON:
{
  "intervention": "${intervention}",
  "backgroundInfo": ["fact1", "fact2", "fact3"],
  "evidenceSummary": "summary text",
  "typicalDosage": "recommendation or null",
  "timing": "timing advice or null",
  "sources": ["source1", "source2"],
  "relatedControls": ["control1", "control2", "control3", "control4"]
}`;

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a research scientist specializing in health, wellness, behavioral science, and nutrition. Provide evidence-based, scientifically accurate information. Be specific and practical.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.6,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0].message.content || '{}';
    const knowledge = JSON.parse(content);
    
    console.log('AI Knowledge Card:', knowledge); // Debug log
    
    return {
      intervention: knowledge.intervention || intervention,
      backgroundInfo: knowledge.backgroundInfo || [
        `Research on ${intervention} and its effects on ${outcome}`,
        'Individual responses may vary - track consistently',
        'Consider environmental and lifestyle factors'
      ],
      evidenceSummary: knowledge.evidenceSummary || `Studies suggest ${intervention} may influence ${outcome}. Personal tracking helps identify individual patterns.`,
      typicalDosage: knowledge.typicalDosage || undefined,
      timing: knowledge.timing || undefined,
      sources: knowledge.sources || ['Research Database', 'Scientific Studies'],
      relatedControls: knowledge.relatedControls || ['sleep quality', 'stress level', 'diet', 'exercise']
    };
}

// Generate clarifying questions using GPT
export async function generateClarifyingQuestionsWithAI(
  parsed: ParsedHypothesis
): Promise<string[]> {
  const client = getOpenAIClient();
  
  const prompt = `Generate 3-4 specific, helpful clarifying questions for someone testing this hypothesis:

Intervention: ${parsed.intervention}
Outcome: ${parsed.outcome}
Category: ${parsed.category}

Create questions that will help design a better experiment:

1. A question about the SPECIFIC CONTEXT of their outcome
   - Example: "When you say 'stress,' do you mean physical tension, mental overwhelm, or both?"
   - Make it specific to "${parsed.outcome}"

2. A question about FREQUENCY/TIMING of the intervention
   - Example: "How often will you ${parsed.intervention}? Daily, 3-4 times per week, or as needed?"
   - Make it specific to "${parsed.intervention}"

3. A question about MEASUREMENT timing
   - Example: "When do you want to track ${parsed.outcome} - morning, evening, or throughout the day?"

4. A question about BASELINE period
   - Example: "Would you like to track ${parsed.outcome} for 3-7 days before starting ${parsed.intervention}?"

Make questions conversational, natural, and specific to THIS intervention and outcome.

Return ONLY a valid JSON object with a "questions" array:
{
  "questions": ["question1", "question2", "question3", "question4"]
}`;

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert in research methodology and experimental design. Create insightful, specific questions that help people design better self-experiments.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0].message.content || '{"questions": []}';
    const result = JSON.parse(content);
    
    console.log('AI Questions:', result); // Debug log
    
    const questions = result.questions || [];
    
    return questions.length > 0 ? questions : [
      `How would you specifically define "${parsed.outcome}" for your tracking?`,
      `How often will you do ${parsed.intervention}?`,
      `When during the day do you want to measure ${parsed.outcome}?`,
      // Baseline is always recommended, so we don't ask about it
      // The system will automatically include a baseline period
    ];
}

// Conversational AI chat function for natural hypothesis creation
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
    const client = getOpenAIClient();
  
  const systemPrompt = `You are a helpful AI assistant that guides users through designing personal experiments and hypotheses to test how different interventions affect their well-being.

IMPORTANT RULES:
1. Ask ONLY ONE question at a time - never ask multiple questions in a single response
2. Sometimes provide clickable options, sometimes don't - mix it up:
   - For YES/NO questions or multiple choice → Provide options (2-4 choices)
   - For open-ended questions or when user needs to elaborate → NO options, let them type freely
   - For questions about specific details (frequency, timing) → Provide options
   - For questions about context or personal experience → NO options, encourage free-form response
3. When providing options, format like this:
   Question: [Your single question here]
   
   Options:
   - [Option 1]
   - [Option 2]
   - [Option 3]
   - [Option 4 or "Other - specify"]
4. When NOT providing options, just ask the question naturally and let them respond freely

Your role:
1. Have a natural, conversational discussion about their hypothesis
2. Ask ONE thoughtful question at a time to understand:
   - What intervention they want to test (e.g., "omega-3", "meditation", "exercise")
   - What outcome they want to measure (e.g., "focus", "stress", "sleep quality")
   - How often they'll do the intervention
   - When they want to track the outcome
   - What control variables might be relevant
3. ALWAYS recommend a baseline tracking period (3-7 days) before starting the intervention. Explain that this helps establish a comparison point and makes the experiment more reliable. Don't ask if they want it - recommend it as a best practice.
4. Provide helpful context and suggestions based on research when relevant
5. Guide them toward creating a well-designed experiment
6. Be conversational and natural - don't follow a rigid script

When the user has provided enough information to create an experiment, set isReadyToCreate to true in the function call.`;

  const chatMessages = [
    { role: 'system' as const, content: systemPrompt },
    ...messages
  ];

  // If we want to extract structured info, use function calling
  const functions = extractInfo ? [
    {
      name: 'extract_hypothesis_info',
      description: 'Extract structured information from the conversation when enough details have been gathered to create a hypothesis',
      parameters: {
        type: 'object',
        properties: {
          intervention: {
            type: 'string',
            description: 'The specific intervention being tested (e.g., "omega-3", "meditation", "morning exercise")'
          },
          outcome: {
            type: 'string',
            description: 'The outcome being measured (e.g., "focus", "stress level", "sleep quality")'
          },
          category: {
            type: 'string',
            enum: ['cognitive', 'physical', 'emotional', 'behavioral', 'sleep', 'nutrition', 'general'],
            description: 'Category of the hypothesis'
          },
          frequency: {
            type: 'string',
            description: 'How often the intervention will be done (e.g., "daily", "3 times per week", "as needed")'
          },
          timing: {
            type: 'string',
            description: 'When to track the outcome (e.g., "morning", "evening", "throughout the day")'
          },
          outcomeContext: {
            type: 'string',
            description: 'Specific context for the outcome (e.g., "focus during work", "stress in social situations")'
          },
          wantsBaseline: {
            type: 'boolean',
            description: 'Always set to true - baseline tracking is always recommended as a best practice for experiments'
          },
          baselineDays: {
            type: 'number',
            description: 'Number of days for baseline period (default: 7 days, range: 3-7 days)'
          },
          selectedControls: {
            type: 'array',
            items: { type: 'string' },
            description: 'Control variables the user wants to track (e.g., ["sleep quality", "stress level", "caffeine intake"])'
          },
          isReadyToCreate: {
            type: 'boolean',
            description: 'Whether enough information has been gathered to create the hypothesis'
          }
        },
        required: ['isReadyToCreate']
      }
    }
  ] : undefined;

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: chatMessages,
    temperature: 0.7,
    ...(functions ? { 
      tools: functions.map(f => ({ type: 'function', function: f })),
      tool_choice: extractInfo ? 'auto' : undefined
    } : {})
  });

  const message = response.choices[0].message;
  let extractedInfo;

  // Handle function calling if used
  if (message.tool_calls && message.tool_calls.length > 0) {
    const toolCall = message.tool_calls[0];
    // Handle both standard and custom tool calls
    if ('function' in toolCall && toolCall.function.name === 'extract_hypothesis_info') {
      try {
        extractedInfo = JSON.parse(toolCall.function.arguments);
      } catch (e) {
        console.error('Error parsing extracted info:', e);
      }
    }
  }

    return {
      response: message.content || '',
      extractedInfo
    };
  } catch (error) {
    console.error('Error in chatWithAI:', error);
    // Return a helpful error message
    throw new Error(error instanceof Error ? error.message : 'Failed to get AI response. Please check your API key configuration.');
  }
}

