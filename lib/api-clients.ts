/**
 * API clients for third-party fitness apps (Strava, Fitbit, etc.)
 */

export interface StravaActivity {
  id: number;
  name: string;
  distance: number; // meters
  moving_time: number; // seconds
  elapsed_time: number; // seconds
  total_elevation_gain: number; // meters
  type: string; // Run, Ride, etc.
  start_date: string;
  start_date_local: string;
  timezone: string;
  average_speed: number; // m/s
  max_speed: number; // m/s
  average_cadence?: number;
  average_heartrate?: number;
  max_heartrate?: number;
  calories?: number;
}

export interface StravaTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  token_type: string;
}

export interface FitbitTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number; // seconds
  token_type: string;
  user_id: string;
}

export interface GarminTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number; // seconds
  token_type: string;
}

export interface FitbitActivity {
  activityId: number;
  activityName: string;
  activityTypeId: number;
  activityTypeName: string;
  calories: number;
  duration: number; // milliseconds
  distance?: number; // meters
  distanceUnit?: string;
  startTime: string;
  steps?: number;
  averageHeartRate?: number;
  heartRateZones?: Array<{
    caloriesOut: number;
    max: number;
    min: number;
    minutes: number;
    name: string;
  }>;
}

/**
 * Get stored access token for a service
 */
export function getStoredToken(service: string): { access_token: string; expires_at: number } | null {
  if (typeof window === 'undefined') return null;
  const key = `${service}_token`;
  const stored = localStorage.getItem(key);
  if (!stored) return null;
  
  try {
    const tokenData = JSON.parse(stored);
    // Check if token is expired
    if (tokenData.expires_at && tokenData.expires_at * 1000 < Date.now()) {
      // Token expired, try to refresh
      return null;
    }
    return tokenData;
  } catch {
    return null;
  }
}

/**
 * Store access token for a service
 */
export function storeToken(service: string, tokenData: StravaTokenResponse | FitbitTokenResponse | GarminTokenResponse): void {
  if (typeof window === 'undefined') return;
  const key = `${service}_token`;
  
  // Handle different token formats (Strava uses expires_at, Fitbit/Garmin use expires_in)
  const expires_at = 'expires_at' in tokenData 
    ? tokenData.expires_at 
    : Date.now() / 1000 + (tokenData.expires_in || 0);
  
  localStorage.setItem(key, JSON.stringify({
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    expires_at,
    token_type: tokenData.token_type,
  }));
}

/**
 * Generate Strava OAuth authorization URL
 */
export function getStravaAuthUrl(clientId: string): string {
  const redirectUri = `${window.location.origin}/auth/strava/callback`;
  const scope = 'read,activity:read';
  const responseType = 'code';
  const approvalPrompt = 'auto';
  
  return `https://www.strava.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=${responseType}&scope=${encodeURIComponent(scope)}&approval_prompt=${approvalPrompt}`;
}

/**
 * Generate Fitbit OAuth authorization URL
 */
export function getFitbitAuthUrl(clientId: string): string {
  const redirectUri = `${window.location.origin}/auth/fitbit/callback`;
  const scope = 'activity heartrate sleep profile';
  const responseType = 'code';
  
  return `https://www.fitbit.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=${responseType}&scope=${encodeURIComponent(scope)}`;
}

/**
 * Generate a cryptographically random code verifier for PKCE
 */
export function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

/**
 * Base64 URL encode (RFC 4648 §5)
 */
function base64UrlEncode(buffer: Uint8Array): string {
  // Handle large arrays by chunking
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < buffer.length; i += chunkSize) {
    const chunk = buffer.slice(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Generate code challenge from code verifier (SHA-256 hash + base64 URL encode)
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(new Uint8Array(digest));
}

/**
 * Generate Garmin OAuth authorization URL with PKCE
 */
export async function getGarminAuthUrl(clientId: string, codeVerifier: string): Promise<string> {
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const redirectUri = `${window.location.origin}/auth/garmin/callback`;
  const scope = 'activity daily_health_stats';
  const responseType = 'code';
  
  return `https://connect.garmin.com/oauthConfirm?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=${responseType}&scope=${encodeURIComponent(scope)}&code_challenge=${codeChallenge}&code_challenge_method=S256`;
}

/**
 * Exchange Garmin authorization code for access token
 */
export async function exchangeGarminCode(code: string, codeVerifier: string): Promise<GarminTokenResponse> {
  const response = await fetch('/api/auth-exchange', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      service: 'garmin',
      code,
      code_verifier: codeVerifier,
    }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to exchange authorization code');
  }
  
  return response.json();
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeStravaCode(code: string): Promise<StravaTokenResponse> {
  const response = await fetch('/api/auth-exchange', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      service: 'strava',
      code,
    }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to exchange authorization code');
  }
  
  return response.json();
}

/**
 * Exchange Fitbit authorization code for access token
 */
export async function exchangeFitbitCode(code: string): Promise<FitbitTokenResponse> {
  const response = await fetch('/api/auth-exchange', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      service: 'fitbit',
      code,
    }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to exchange authorization code');
  }
  
  return response.json();
}

/**
 * Fetch Strava activities
 */
export async function fetchStravaActivities(limit: number = 30): Promise<StravaActivity[]> {
  const tokenData = getStoredToken('strava');
  if (!tokenData) {
    throw new Error('No Strava token found. Please connect your Strava account.');
  }
  
  const response = await fetch(`https://www.strava.com/api/v3/athlete/activities?per_page=${limit}`, {
    headers: {
      'Authorization': `Bearer ${tokenData.access_token}`,
    },
  });
  
  if (!response.ok) {
    if (response.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('strava_token');
      throw new Error('Strava token expired. Please reconnect your account.');
    }
    throw new Error('Failed to fetch Strava activities');
  }
  
  return response.json();
}

/**
 * Convert Strava activity to app data points
 */
export function convertStravaActivityToDataPoints(activity: StravaActivity): any[] {
  const dataPoints: any[] = [];
  
  // Create a data point for the activity
  const workoutDate = new Date(activity.start_date_local);
  
  // Determine variable type based on activity type
  let variableType = 'exercise';
  if (activity.type.toLowerCase().includes('run')) {
    variableType = 'running';
  } else if (activity.type.toLowerCase().includes('ride') || activity.type.toLowerCase().includes('bike')) {
    variableType = 'cycling';
  } else if (activity.type.toLowerCase().includes('swim')) {
    variableType = 'swimming';
  }
  
  // Create metadata for the activity
  const metadata = {
    exerciseType: variableType,
    duration: activity.moving_time, // seconds
    distance: activity.distance, // meters
    averageHeartRate: activity.average_heartrate,
    maxHeartRate: activity.max_heartrate,
    calories: activity.calories,
    elevationGain: activity.total_elevation_gain,
    averageSpeed: activity.average_speed,
    maxSpeed: activity.max_speed,
  };
  
  // Return as array of data points (one per activity)
  return [{
    value: 1, // Binary: activity completed
    date: workoutDate.toISOString(),
    metadata,
  }];
}

/**
 * Fetch Fitbit activities
 */
export async function fetchFitbitActivities(limit: number = 20): Promise<FitbitActivity[]> {
  const tokenData = getStoredToken('fitbit');
  if (!tokenData) {
    throw new Error('No Fitbit token found. Please connect your Fitbit account.');
  }
  
  // Get activities from the last 30 days
  const afterDate = new Date();
  afterDate.setDate(afterDate.getDate() - 30);
  const dateStr = afterDate.toISOString().split('T')[0].replace(/-/g, '');
  
  const response = await fetch(
    `https://api.fitbit.com/1/user/-/activities/list.json?afterDate=${dateStr}&sort=asc&limit=${limit}&offset=0`,
    {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    }
  );
  
  if (!response.ok) {
    if (response.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('fitbit_token');
      throw new Error('Fitbit token expired. Please reconnect your account.');
    }
    throw new Error('Failed to fetch Fitbit activities');
  }
  
  const data = await response.json();
  return data.activities || [];
}

/**
 * Convert Fitbit activity to app data points
 */
export function convertFitbitActivityToDataPoints(activity: FitbitActivity): any[] {
  const dataPoints: any[] = [];
  
  // Create a data point for the activity
  const workoutDate = new Date(activity.startTime);
  
  // Determine variable type based on activity type
  let variableType = 'exercise';
  const activityNameLower = activity.activityName.toLowerCase();
  if (activityNameLower.includes('run') || activityNameLower.includes('running')) {
    variableType = 'running';
  } else if (activityNameLower.includes('bike') || activityNameLower.includes('cycling') || activityNameLower.includes('ride')) {
    variableType = 'cycling';
  } else if (activityNameLower.includes('swim') || activityNameLower.includes('swimming')) {
    variableType = 'swimming';
  } else if (activityNameLower.includes('walk') || activityNameLower.includes('walking')) {
    variableType = 'walking';
  }
  
  // Convert duration from milliseconds to seconds
  const durationSeconds = activity.duration / 1000;
  
  // Create metadata for the activity
  const metadata = {
    exerciseType: variableType,
    duration: durationSeconds, // seconds
    distance: activity.distance, // meters
    averageHeartRate: activity.averageHeartRate,
    calories: activity.calories,
    steps: activity.steps,
    heartRateZones: activity.heartRateZones,
  };
  
  // Return as array of data points (one per activity)
  return [{
    value: 1, // Binary: activity completed
    date: workoutDate.toISOString(),
    metadata,
  }];
}

