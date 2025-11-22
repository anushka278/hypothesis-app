import { Insight, DataPoint, Variable, Hypothesis } from './types';
import { getDataPoints, getVariables } from './storage';

export function generateInsights(variableIds?: string[]): Insight[] {
  const insights: Insight[] = [];
  const variables = getVariables();
  const targetVariables = variableIds 
    ? variables.filter(v => variableIds.includes(v.id))
    : variables;

  targetVariables.forEach(variable => {
    const dataPoints = getDataPoints(variable.id);
    
    if (dataPoints.length >= 3) {
      insights.push(...analyzeVariable(variable, dataPoints));
    }
  });

  // Add correlation insights if we have multiple variables
  if (targetVariables.length >= 2) {
    insights.push(...analyzeCorrelations(targetVariables));
  }

  return insights;
}

function analyzeVariable(variable: Variable, dataPoints: DataPoint[]): Insight[] {
  const insights: Insight[] = [];
  const sortedPoints = [...dataPoints].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Pattern detection - upward trend
  if (sortedPoints.length >= 5) {
    const recent = sortedPoints.slice(-5);
    const avgFirst = recent.slice(0, 2).reduce((sum, p) => sum + p.value, 0) / 2;
    const avgLast = recent.slice(-2).reduce((sum, p) => sum + p.value, 0) / 2;
    
    if (avgLast > avgFirst * 1.2) {
      insights.push({
        id: `insight-${variable.id}-trend-up`,
        text: `📈 Your ${variable.name} has been trending upward over the past week. Keep up the momentum!`,
        type: 'pattern',
        createdAt: new Date().toISOString(),
      });
    } else if (avgLast < avgFirst * 0.8) {
      insights.push({
        id: `insight-${variable.id}-trend-down`,
        text: `📉 Your ${variable.name} has been declining recently. Consider what might be affecting this.`,
        type: 'pattern',
        createdAt: new Date().toISOString(),
      });
    }
  }

  // Consistency insight
  if (sortedPoints.length >= 7) {
    const recentWeek = sortedPoints.slice(-7);
    const values = recentWeek.map(p => p.value);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
    
    if (variance < 0.5) {
      insights.push({
        id: `insight-${variable.id}-consistent`,
        text: `✨ Your ${variable.name} has been remarkably consistent. This stability is a good sign!`,
        type: 'pattern',
        createdAt: new Date().toISOString(),
      });
    }
  }

  // High/low days
  if (sortedPoints.length >= 3) {
    const values = sortedPoints.map(p => p.value);
    const max = Math.max(...values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    
    if (max > avg * 1.5) {
      insights.push({
        id: `insight-${variable.id}-peak`,
        text: `⭐ You've hit some impressive peaks with ${variable.name}. Try to identify what made those days special.`,
        type: 'general',
        createdAt: new Date().toISOString(),
      });
    }
  }

  return insights;
}

function analyzeCorrelations(variables: Variable[]): Insight[] {
  const insights: Insight[] = [];
  
  // Simple correlation between first two variables
  if (variables.length >= 2) {
    const var1 = variables[0];
    const var2 = variables[1];
    const points1 = getDataPoints(var1.id);
    const points2 = getDataPoints(var2.id);
    
    if (points1.length >= 3 && points2.length >= 3) {
      // Find overlapping dates
      const dates1 = new Set(points1.map(p => p.date));
      const overlapping = points2.filter(p => dates1.has(p.date));
      
      if (overlapping.length >= 3) {
        insights.push({
          id: `insight-correlation-${var1.id}-${var2.id}`,
          text: `🔗 You've been tracking both ${var1.name} and ${var2.name} consistently. Over time, patterns may emerge showing how they relate to each other.`,
          type: 'correlation',
          createdAt: new Date().toISOString(),
        });
      }
    }
  }
  
  return insights;
}

export function generateWelcomeMessage(): string {
  return "👋 Welcome! I'm here to help you explore how your daily habits and behaviors affect your well-being. Let's start by creating your first hypothesis. What would you like to investigate?";
}

export function generateFollowUpQuestion(userInput: string): string {
  const lowerInput = userInput.toLowerCase();
  
  if (lowerInput.includes('mood') || lowerInput.includes('feel')) {
    return "Great! Mood is an important metric. What specific behavior or habit do you think might be influencing your mood? For example: exercise, sleep, meditation, social time, etc.";
  }
  
  if (lowerInput.includes('sleep') || lowerInput.includes('energy')) {
    return "Excellent choice! What factors do you think might be affecting your sleep or energy levels? Consider things like caffeine intake, screen time, exercise, or bedtime routine.";
  }
  
  if (lowerInput.includes('exercise') || lowerInput.includes('workout')) {
    return "Physical activity is a great thing to track! What outcome are you interested in measuring? For example: mood, energy levels, sleep quality, or stress levels?";
  }
  
  return "Interesting! To help you track this, what would you like to measure? Think about both the behavior you want to track and the outcome you want to observe.";
}

export function generateConclusion(hypothesis: Hypothesis): { verdict: 'supported' | 'rejected' | 'inconclusive'; summary: string } {
  const { getDataPoints } = require('./storage');
  
  // Find primary variables (intervention and outcome)
  const interventionVar = hypothesis.variables.find(v => 
    !v.isControl && 
    hypothesis.parsed?.intervention?.toLowerCase().includes(v.name.toLowerCase())
  );
  const outcomeVar = hypothesis.variables.find(v => 
    !v.isControl && 
    hypothesis.parsed?.outcome?.toLowerCase().includes(v.name.toLowerCase())
  );
  
  // If we can't match variables, use first two primary variables
  const primaryVars = hypothesis.variables.filter(v => !v.isControl);
  const var1 = interventionVar || primaryVars[0];
  const var2 = outcomeVar || primaryVars[1];
  
  if (!var1 || !var2) {
    return {
      verdict: 'inconclusive',
      summary: 'Unable to generate conclusion: insufficient variable data for analysis.',
    };
  }
  
  const points1 = getDataPoints(var1.id);
  const points2 = getDataPoints(var2.id);
  
  if (points1.length < 5 || points2.length < 5) {
    return {
      verdict: 'inconclusive',
      summary: 'More data collection is needed to draw meaningful conclusions. Please continue tracking for a few more days.',
    };
  }
  
  // Find overlapping dates
  const dates1 = new Set(points1.map(p => p.date));
  const overlappingPoints = points2.filter(p => dates1.has(p.date));
  
  if (overlappingPoints.length < 5) {
    return {
      verdict: 'inconclusive',
      summary: 'Not enough overlapping data points to analyze the relationship. Try to log both variables on the same days.',
    };
  }
  
  // Match points by date
  const matchedPoints: { var1: number; var2: number; date: string }[] = [];
  points1.forEach(p1 => {
    const p2 = overlappingPoints.find(p => p.date === p1.date);
    if (p2) {
      matchedPoints.push({ var1: p1.value, var2: p2.value, date: p1.date });
    }
  });
  
  // Calculate correlation
  const avg1 = matchedPoints.reduce((sum, p) => sum + p.var1, 0) / matchedPoints.length;
  const avg2 = matchedPoints.reduce((sum, p) => sum + p.var2, 0) / matchedPoints.length;
  
  let covariance = 0;
  let variance1 = 0;
  let variance2 = 0;
  
  matchedPoints.forEach(p => {
    const diff1 = p.var1 - avg1;
    const diff2 = p.var2 - avg2;
    covariance += diff1 * diff2;
    variance1 += diff1 * diff1;
    variance2 += diff2 * diff2;
  });
  
  const correlation = variance1 === 0 || variance2 === 0 
    ? 0 
    : covariance / Math.sqrt(variance1 * variance2);
  
  // Determine verdict based on correlation
  let verdict: 'supported' | 'rejected' | 'inconclusive';
  let summary: string;
  
  const interventionName = hypothesis.parsed?.intervention || var1.name;
  const outcomeName = hypothesis.parsed?.outcome || var2.name;
  
  if (correlation > 0.4) {
    verdict = 'supported';
    const percentChange = Math.round(Math.abs(correlation) * 100);
    summary = `Your hypothesis appears to be supported! On days you ${interventionName.toLowerCase()}, your ${outcomeName.toLowerCase()} was approximately ${percentChange}% higher. This suggests a positive correlation between ${interventionName} and ${outcomeName}. Consider continuing this intervention if it aligns with your goals.`;
  } else if (correlation < -0.2) {
    verdict = 'rejected';
    summary = `Based on your data, there appears to be a negative relationship between ${interventionName} and ${outcomeName}. On days you engaged in ${interventionName.toLowerCase()}, your ${outcomeName.toLowerCase()} tended to be lower. You may want to reconsider this intervention or investigate other factors that might be affecting your ${outcomeName.toLowerCase()}.`;
  } else {
    verdict = 'inconclusive';
    summary = `The data does not show a clear relationship between ${interventionName} and ${outcomeName}. This could mean:\n\n• The intervention may not have a significant effect\n• Other factors may be influencing your ${outcomeName.toLowerCase()}\n• More data or a longer tracking period might be needed\n\nConsider continuing to track both variables or exploring other interventions.`;
  }
  
  return { verdict, summary };
}

