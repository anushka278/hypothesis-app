import { ParsedHypothesis, KnowledgeCard } from './types';

// Natural Language Parsing for Hypothesis
export function parseHypothesis(text: string): ParsedHypothesis {
  const lower = text.toLowerCase();
  
  // Extract intervention
  const intervention = extractIntervention(lower);
  
  // Extract outcome
  const outcome = extractOutcome(lower);
  
  // Determine category
  const category = categorizeHypothesis(intervention, outcome, lower);
  
  // Calculate confidence based on clarity of parsing
  const confidence = calculateConfidence(intervention, outcome, lower);
  
  return {
    intervention,
    outcome,
    category,
    confidence,
  };
}

function extractIntervention(text: string): string {
  // Common intervention patterns
  const patterns = [
    /(?:taking|taking a|using|doing|practicing|getting|having|drinking|eating)\s+([^,.]+?)(?:\s+(?:improves|helps|affects|impacts|influences|changes|increases|decreases|reduces))/i,
    /(?:if|whether)\s+([^,.]+?)\s+(?:improves|helps|affects|impacts|influences|changes)/i,
    /(?:does|will)\s+([^,.]+?)\s+(?:improve|help|affect|impact|influence|change)/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return cleanText(match[1]);
    }
  }
  
  // Common interventions
  const interventions = [
    'omega-3', 'omega 3', 'fish oil', 'vitamin d', 'meditation', 'exercise',
    'yoga', 'running', 'walking', 'sleep', 'water', 'caffeine', 'coffee',
    'journaling', 'cold shower', 'stretching', 'breathing exercises',
    'magnesium', 'protein', 'carbs', 'fasting', 'screen time', 'social time'
  ];
  
  for (const intervention of interventions) {
    if (text.includes(intervention)) {
      return cleanText(intervention);
    }
  }
  
  return 'daily intervention';
}

function extractOutcome(text: string): string {
  // Common outcome patterns
  const patterns = [
    /(?:improves|improve|helps|help|affects|affect|impacts|impact|influences|influence|changes|change|increases|increase|decreases|decrease|reduces|reduce)\s+(?:my\s+)?([^,.]+)/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return cleanText(match[1]);
    }
  }
  
  // Common outcomes
  const outcomes = [
    'focus', 'concentration', 'mood', 'energy', 'sleep quality', 'stress',
    'anxiety', 'productivity', 'memory', 'clarity', 'motivation',
    'well-being', 'happiness', 'performance', 'recovery', 'digestion'
  ];
  
  for (const outcome of outcomes) {
    if (text.includes(outcome)) {
      return cleanText(outcome);
    }
  }
  
  return 'well-being';
}

function categorizeHypothesis(intervention: string, outcome: string, fullText: string): ParsedHypothesis['category'] {
  const cognitiveKeywords = ['focus', 'concentration', 'memory', 'clarity', 'cognitive', 'thinking', 'attention', 'productivity', 'performance'];
  const physicalKeywords = ['energy', 'strength', 'endurance', 'recovery', 'pain', 'physical', 'fitness', 'stamina'];
  const emotionalKeywords = ['mood', 'happiness', 'stress', 'anxiety', 'depression', 'emotional', 'well-being', 'mental health'];
  const sleepKeywords = ['sleep', 'rest', 'insomnia', 'sleep quality', 'sleeping'];
  const nutritionKeywords = ['diet', 'nutrition', 'digestion', 'weight', 'appetite', 'eating'];
  const behavioralKeywords = ['habit', 'routine', 'behavior', 'consistency', 'discipline'];
  
  const combinedText = `${intervention} ${outcome} ${fullText}`.toLowerCase();
  
  if (cognitiveKeywords.some(k => combinedText.includes(k))) return 'cognitive';
  if (physicalKeywords.some(k => combinedText.includes(k))) return 'physical';
  if (emotionalKeywords.some(k => combinedText.includes(k))) return 'emotional';
  if (sleepKeywords.some(k => combinedText.includes(k))) return 'sleep';
  if (nutritionKeywords.some(k => combinedText.includes(k))) return 'nutrition';
  if (behavioralKeywords.some(k => combinedText.includes(k))) return 'behavioral';
  
  return 'general';
}

function calculateConfidence(intervention: string, outcome: string, text: string): number {
  let confidence = 0.5;
  
  // Higher confidence if specific intervention detected
  if (intervention !== 'daily intervention') confidence += 0.2;
  
  // Higher confidence if specific outcome detected
  if (outcome !== 'well-being') confidence += 0.2;
  
  // Higher confidence if text contains clear causal language
  const causalWords = ['improves', 'helps', 'affects', 'impacts', 'influences', 'if', 'whether', 'does'];
  if (causalWords.some(word => text.includes(word))) confidence += 0.1;
  
  return Math.min(confidence, 1.0);
}

function cleanText(text: string): string {
  return text.trim()
    .replace(/^(a|an|the|my)\s+/i, '')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

// Generate Knowledge Card based on intervention
export function generateKnowledgeCard(intervention: string, outcome: string, category: ParsedHypothesis['category']): KnowledgeCard {
  const interventionLower = intervention.toLowerCase();
  
  // Knowledge base
  const knowledgeBase: Record<string, Partial<KnowledgeCard>> = {
    'omega-3': {
      backgroundInfo: [
        'Omega-3 fatty acids (EPA and DHA) are essential fats found in fish oil and algae',
        'Research suggests potential benefits for cognitive function and mood regulation',
        'Effects typically manifest after 2-4 weeks of consistent supplementation'
      ],
      evidenceSummary: 'Meta-analyses show moderate evidence for omega-3 benefits in cognitive performance, particularly for sustained attention and working memory. Effects are more pronounced with consistent long-term use.',
      typicalDosage: '250-1000 mg combined EPA+DHA per day. Plant-based users can use algae-derived DHA (200-300 mg/day)',
      timing: 'Best taken with meals to improve absorption. Morning or midday recommended.',
      sources: ['PubMed: Omega-3 and Cognitive Function', 'Cochrane Review: Fish Oil Supplementation'],
      relatedControls: ['sleep quality', 'caffeine intake', 'diet quality', 'stress levels']
    },
    'fish oil': {
      backgroundInfo: [
        'Fish oil contains omega-3 fatty acids (EPA and DHA)',
        'Common supplement for cognitive and cardiovascular health',
        'Quality varies by brand - look for third-party testing'
      ],
      evidenceSummary: 'Moderate evidence supports fish oil for cognitive function. Effects may take 2-4 weeks to notice.',
      typicalDosage: '500-2000 mg per day (check EPA+DHA content)',
      timing: 'Take with food to reduce potential digestive discomfort',
      relatedControls: ['sleep', 'diet', 'stress', 'exercise']
    },
    'meditation': {
      backgroundInfo: [
        'Mindfulness meditation involves focused attention and present-moment awareness',
        'Research shows structural brain changes with consistent practice (8+ weeks)',
        'Benefits accumulate over time - consistency matters more than duration'
      ],
      evidenceSummary: 'Strong evidence for meditation reducing stress and improving attention. Benefits include reduced anxiety, better emotional regulation, and enhanced focus.',
      typicalDosage: '5-20 minutes daily. Start with 5 minutes and gradually increase.',
      timing: 'Morning meditation can set positive tone for the day. Evening helps with sleep.',
      sources: ['Neuroscience of Mindfulness', 'Harvard Medical: Meditation Benefits'],
      relatedControls: ['sleep quality', 'stress events', 'exercise', 'screen time']
    },
    'exercise': {
      backgroundInfo: [
        'Physical activity increases blood flow and releases endorphins',
        'Both acute (immediate) and chronic (long-term) benefits exist',
        'Moderate intensity often optimal for cognitive and mood benefits'
      ],
      evidenceSummary: 'Robust evidence shows exercise improves mood, energy, focus, and sleep quality. Effects can be immediate and long-term.',
      typicalDosage: '20-30 minutes of moderate activity, 3-5 times per week',
      timing: 'Morning exercise energizes. Evening exercise helps sleep (finish 2-3 hours before bed)',
      relatedControls: ['sleep quality', 'nutrition', 'hydration', 'stress']
    },
    'vitamin d': {
      backgroundInfo: [
        'Vitamin D is crucial for bone health, immune function, and mood regulation',
        'Many people are deficient, especially in winter or with limited sun exposure',
        'Blood testing can determine your baseline level'
      ],
      evidenceSummary: 'Evidence supports vitamin D for mood improvement in deficient individuals. Effects typically seen after 4-8 weeks.',
      typicalDosage: '1000-4000 IU per day (consult healthcare provider for optimal dose)',
      timing: 'Take with fat-containing meal for better absorption',
      relatedControls: ['sun exposure', 'mood', 'sleep', 'energy levels']
    },
    'caffeine': {
      backgroundInfo: [
        'Caffeine is a stimulant that blocks adenosine receptors',
        'Effects peak 30-60 minutes after consumption',
        'Half-life is 3-5 hours, can affect sleep if consumed late'
      ],
      evidenceSummary: 'Strong evidence for caffeine improving alertness and focus. Can negatively impact sleep if consumed after 2pm.',
      typicalDosage: '50-200 mg per serving (1-2 cups of coffee)',
      timing: 'Morning or early afternoon only. Avoid 6+ hours before bedtime.',
      relatedControls: ['sleep quality', 'anxiety levels', 'hydration', 'energy']
    },
    'journaling': {
      backgroundInfo: [
        'Expressive writing can process emotions and reduce stress',
        'Gratitude journaling linked to improved well-being',
        'Consistency matters more than length'
      ],
      evidenceSummary: 'Moderate to strong evidence for journaling reducing stress and improving emotional clarity.',
      typicalDosage: '5-15 minutes daily or 3-4 times per week',
      timing: 'Evening reflection is popular. Morning journaling can set intentions.',
      relatedControls: ['mood', 'stress events', 'sleep quality', 'social connections']
    },
  };
  
  // Default knowledge card
  const defaultCard: KnowledgeCard = {
    intervention: intervention,
    backgroundInfo: [
      `${intervention} is your chosen intervention to track`,
      'Track consistently for at least 7-14 days to identify patterns',
      'Consider environmental factors that might influence results'
    ],
    evidenceSummary: 'Personal experimentation can reveal individual responses. Track diligently and watch for patterns.',
    relatedControls: getDefaultControlVariables(category),
  };
  
  // Find matching knowledge or use default
  const matchedKey = Object.keys(knowledgeBase).find(key => 
    interventionLower.includes(key) || key.includes(interventionLower)
  );
  
  const knowledge = matchedKey ? knowledgeBase[matchedKey] : {};
  
  return {
    ...defaultCard,
    ...knowledge,
    intervention,
    relatedControls: knowledge.relatedControls || getDefaultControlVariables(category),
  };
}

// Suggest control variables based on outcome category
export function getDefaultControlVariables(category: ParsedHypothesis['category']): string[] {
  const controlMap: Record<ParsedHypothesis['category'], string[]> = {
    cognitive: ['sleep quality', 'caffeine intake', 'stress level', 'hydration', 'diet quality'],
    physical: ['sleep quality', 'nutrition', 'hydration', 'stress', 'recovery time'],
    emotional: ['sleep quality', 'stress events', 'social interaction', 'exercise', 'screen time'],
    sleep: ['caffeine intake', 'screen time before bed', 'exercise', 'stress level', 'bedtime consistency'],
    nutrition: ['sleep quality', 'exercise', 'hydration', 'stress', 'meal timing'],
    behavioral: ['mood', 'energy level', 'sleep quality', 'stress', 'motivation'],
    general: ['sleep quality', 'stress level', 'mood', 'energy level'],
  };
  
  return controlMap[category] || controlMap.general;
}

// Generate clarifying questions based on parsed hypothesis
export function generateClarifyingQuestions(parsed: ParsedHypothesis): string[] {
  const questions: string[] = [];
  
  // Outcome clarification
  const outcomeContexts: Record<string, string> = {
    'focus': 'When you say "focus," do you mean during work, study, or throughout your daily life?',
    'mood': 'Are you tracking overall mood, or specific aspects like anxiety, happiness, or irritability?',
    'energy': 'Do you mean physical energy, mental energy, or both?',
    'sleep': 'Are you focused on sleep quality, duration, or how rested you feel?',
    'stress': 'Would you like to track perceived stress levels or physical stress symptoms?',
    'productivity': 'How do you measure productivity - tasks completed, time focused, or quality of work?',
  };
  
  for (const [keyword, question] of Object.entries(outcomeContexts)) {
    if (parsed.outcome.includes(keyword)) {
      questions.push(question);
      break;
    }
  }
  
  // Frequency question
  const interventionLower = parsed.intervention.toLowerCase();
  if (interventionLower.includes('exercise') || interventionLower.includes('meditation') || 
      interventionLower.includes('journal')) {
    questions.push(`How often will you practice ${parsed.intervention}? (e.g., daily, 3x per week)`);
  } else if (interventionLower.includes('omega') || interventionLower.includes('vitamin') || 
             interventionLower.includes('supplement')) {
    questions.push(`How often will you take ${parsed.intervention}? (e.g., daily with breakfast)`);
  }
  
  // Timing question based on category
  if (parsed.category === 'cognitive') {
    questions.push('What time of day do you want to track your focus/performance? (morning, afternoon, evening)');
  }
  
  // Baseline question
  questions.push('Would you like to track a baseline period (3-7 days) before starting the intervention?');
  
  return questions;
}

