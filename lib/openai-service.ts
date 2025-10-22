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
      'Would you like a baseline period before starting?'
    ];
}

