import { Hypothesis, DataPoint, Variable } from './types';

const STORAGE_KEYS = {
  HYPOTHESES: 'hypotheses',
  DATA_POINTS: 'dataPoints',
  VARIABLES: 'variables',
};

// Hypotheses
export function saveHypothesis(hypothesis: Hypothesis): void {
  const hypotheses = getHypotheses();
  const existingIndex = hypotheses.findIndex(h => h.id === hypothesis.id);
  
  if (existingIndex >= 0) {
    hypotheses[existingIndex] = hypothesis;
  } else {
    hypotheses.push(hypothesis);
  }
  
  localStorage.setItem(STORAGE_KEYS.HYPOTHESES, JSON.stringify(hypotheses));
  
  // Save variables
  hypothesis.variables.forEach(v => saveVariable(v));
}

export function getHypotheses(): Hypothesis[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.HYPOTHESES);
  return data ? JSON.parse(data) : [];
}

export function getActiveHypotheses(): Hypothesis[] {
  return getHypotheses().filter(h => !h.archived);
}

export function archiveHypothesis(id: string): void {
  const hypotheses = getHypotheses();
  const hypothesis = hypotheses.find(h => h.id === id);
  if (hypothesis) {
    hypothesis.archived = true;
    localStorage.setItem(STORAGE_KEYS.HYPOTHESES, JSON.stringify(hypotheses));
  }
}

// Variables
export function saveVariable(variable: Variable): void {
  const variables = getVariables();
  const existingIndex = variables.findIndex(v => v.id === variable.id);
  
  if (existingIndex >= 0) {
    variables[existingIndex] = variable;
  } else {
    variables.push(variable);
  }
  
  localStorage.setItem(STORAGE_KEYS.VARIABLES, JSON.stringify(variables));
}

export function getVariables(): Variable[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.VARIABLES);
  return data ? JSON.parse(data) : [];
}

export function getActiveVariables(): Variable[] {
  const activeHypotheses = getActiveHypotheses();
  const activeHypothesisIds = activeHypotheses.map(h => h.id);
  return getVariables().filter(v => activeHypothesisIds.includes(v.hypothesisId));
}

// Data Points
export function saveDataPoint(dataPoint: DataPoint): void {
  const dataPoints = getDataPoints();
  const existingIndex = dataPoints.findIndex(dp => dp.id === dataPoint.id);
  
  if (existingIndex >= 0) {
    dataPoints[existingIndex] = dataPoint;
  } else {
    dataPoints.push(dataPoint);
  }
  
  localStorage.setItem(STORAGE_KEYS.DATA_POINTS, JSON.stringify(dataPoints));
}

export function getDataPoints(variableId?: string): DataPoint[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.DATA_POINTS);
  const allPoints: DataPoint[] = data ? JSON.parse(data) : [];
  
  if (variableId) {
    return allPoints.filter(dp => dp.variableId === variableId);
  }
  
  return allPoints;
}

export function getRecentDataPoints(variableId: string, days: number = 7): DataPoint[] {
  const points = getDataPoints(variableId);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return points
    .filter(p => new Date(p.date) >= cutoffDate)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function getStreak(variableId: string): number {
  const points = getDataPoints(variableId);
  if (points.length === 0) return 0;
  
  const sortedPoints = points.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < sortedPoints.length; i++) {
    const pointDate = new Date(sortedPoints[i].date);
    pointDate.setHours(0, 0, 0, 0);
    
    const expectedDate = new Date(today);
    expectedDate.setDate(today.getDate() - i);
    expectedDate.setHours(0, 0, 0, 0);
    
    if (pointDate.getTime() === expectedDate.getTime()) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}

// Clear all data
export function clearAllData(): void {
  localStorage.removeItem(STORAGE_KEYS.HYPOTHESES);
  localStorage.removeItem(STORAGE_KEYS.DATA_POINTS);
  localStorage.removeItem(STORAGE_KEYS.VARIABLES);
}

