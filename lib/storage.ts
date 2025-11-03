import { Hypothesis, DataPoint, Variable, UserProfile, AppSettings, DataSource, ConnectedApp, ConnectedDevice } from './types';

const STORAGE_KEYS = {
  HYPOTHESES: 'hypotheses',
  DATA_POINTS: 'dataPoints',
  VARIABLES: 'variables',
  USER_PROFILE: 'userProfile',
  APP_SETTINGS: 'appSettings',
  DATA_SOURCES: 'dataSources',
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

// User Profile
export function getUserProfile(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
  return data ? JSON.parse(data) : null;
}

export function saveUserProfile(profile: UserProfile): void {
  profile.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
}

export function updateUserProfile(updates: Partial<UserProfile>): UserProfile {
  const existing = getUserProfile();
  const profileId = existing?.id || `profile-${Date.now()}`;
  const createdAt = existing?.createdAt || new Date().toISOString();
  
  const profile: UserProfile = {
    ...existing,
    ...updates,
    id: profileId,
    createdAt,
    updatedAt: new Date().toISOString(),
  } as UserProfile;
  
  saveUserProfile(profile);
  return profile;
}

// App Settings
export function getAppSettings(): AppSettings {
  if (typeof window === 'undefined') {
    return getDefaultSettings();
  }
  const data = localStorage.getItem(STORAGE_KEYS.APP_SETTINGS);
  if (data) {
    const settings = JSON.parse(data);
    // Migrate old color values
    if (settings.accentColor === 'purple') {
      settings.accentColor = 'brown';
    }
    if (settings.accentColor === 'yellow') {
      settings.accentColor = 'orange';
    }
    // Merge with defaults to handle new settings that might have been added
    return { ...getDefaultSettings(), ...settings };
  }
  return getDefaultSettings();
}

function getDefaultSettings(): AppSettings {
  return {
    notifications: {
      enabled: true,
      reminderTime: '20:00',
      reminderDays: [1, 2, 3, 4, 5], // Weekdays
    },
    colorScheme: 'light',
    accentColor: 'teal',
    units: 'metric',
    dataPrivacy: {
      shareAnalytics: false,
      allowDataExport: true,
      autoBackup: false,
    },
    updatedAt: new Date().toISOString(),
  };
}

export function saveAppSettings(settings: AppSettings): void {
  settings.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEYS.APP_SETTINGS, JSON.stringify(settings));
}

export function updateAppSettings(updates: Partial<AppSettings>): AppSettings {
  const existing = getAppSettings();
  const settings: AppSettings = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  saveAppSettings(settings);
  return settings;
}

// Data Sources (Apps & Devices)
export function getDataSources(): DataSource[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.DATA_SOURCES);
  return data ? JSON.parse(data) : [];
}

export function saveDataSource(dataSource: DataSource): void {
  const sources = getDataSources();
  const existingIndex = sources.findIndex(s => s.id === dataSource.id);
  
  if (existingIndex >= 0) {
    sources[existingIndex] = dataSource;
  } else {
    sources.push(dataSource);
  }
  
  localStorage.setItem(STORAGE_KEYS.DATA_SOURCES, JSON.stringify(sources));
}

export function deleteDataSource(id: string): void {
  const sources = getDataSources();
  const filtered = sources.filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEYS.DATA_SOURCES, JSON.stringify(filtered));
  
  // Also remove dataSourceId from any variables using it
  const variables = getVariables();
  variables.forEach(v => {
    if (v.dataSourceId === id) {
      delete v.dataSourceId;
      saveVariable(v);
    }
  });
}

// Clear all data
export function clearAllData(): void {
  localStorage.removeItem(STORAGE_KEYS.HYPOTHESES);
  localStorage.removeItem(STORAGE_KEYS.DATA_POINTS);
  localStorage.removeItem(STORAGE_KEYS.VARIABLES);
}

