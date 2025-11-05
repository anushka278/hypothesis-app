/**
 * File parsers for workout data files (GPX, TCX, XML)
 */

export interface WorkoutDataPoint {
  timestamp: string;
  heartRate?: number;
  latitude?: number;
  longitude?: number;
  elevation?: number;
  distance?: number; // in meters
  cadence?: number;
  power?: number;
}

export interface ParsedWorkoutData {
  type: 'gpx' | 'tcx' | 'xml';
  startTime: string;
  endTime?: string;
  dataPoints: WorkoutDataPoint[];
  totalDistance?: number;
  averageHeartRate?: number;
  maxHeartRate?: number;
}

/**
 * Parse GPX file content
 */
export function parseGPX(content: string): ParsedWorkoutData {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(content, 'text/xml');
  
  const dataPoints: WorkoutDataPoint[] = [];
  let startTime: string | null = null;
  let endTime: string | null = null;
  let totalDistance = 0;
  const heartRates: number[] = [];
  
  // Get all track points
  const trackPoints = xmlDoc.getElementsByTagName('trkpt');
  
  for (let i = 0; i < trackPoints.length; i++) {
    const point = trackPoints[i];
    const lat = parseFloat(point.getAttribute('lat') || '0');
    const lon = parseFloat(point.getAttribute('lon') || '0');
    
    // Get elevation
    const ele = point.getElementsByTagName('ele')[0];
    const elevation = ele ? parseFloat(ele.textContent || '0') : undefined;
    
    // Get time
    const time = point.getElementsByTagName('time')[0];
    const timestamp = time ? time.textContent || '' : '';
    
    if (timestamp && !startTime) {
      startTime = timestamp;
    }
    if (timestamp) {
      endTime = timestamp;
    }
    
    // Get heart rate (GPX with extensions)
    let heartRate: number | undefined;
    const extensions = point.getElementsByTagName('extensions')[0];
    if (extensions) {
      // Try different namespace variations
      const hrElements = [
        extensions.getElementsByTagName('gpxtpx:hr')[0],
        extensions.getElementsByTagName('hr')[0],
        extensions.querySelector('*[localName()="hr"]'),
      ].filter(Boolean);
      
      if (hrElements.length > 0) {
        const hrText = hrElements[0]?.textContent || '';
        heartRate = parseInt(hrText, 10);
        if (heartRate && !isNaN(heartRate)) {
          heartRates.push(heartRate);
        }
      }
    }
    
    // Calculate distance from previous point if available
    let distance: number | undefined;
    if (i > 0 && dataPoints[i - 1].latitude && dataPoints[i - 1].longitude) {
      distance = calculateDistance(
        dataPoints[i - 1].latitude!,
        dataPoints[i - 1].longitude!,
        lat,
        lon
      );
      totalDistance += distance;
    }
    
    dataPoints.push({
      timestamp,
      latitude: lat,
      longitude: lon,
      elevation,
      heartRate,
      distance,
    });
  }
  
  // Calculate average and max heart rate
  const averageHeartRate = heartRates.length > 0
    ? Math.round(heartRates.reduce((a, b) => a + b, 0) / heartRates.length)
    : undefined;
  const maxHeartRate = heartRates.length > 0 ? Math.max(...heartRates) : undefined;
  
  return {
    type: 'gpx',
    startTime: startTime || new Date().toISOString(),
    endTime: endTime || undefined,
    dataPoints,
    totalDistance,
    averageHeartRate,
    maxHeartRate,
  };
}

/**
 * Parse TCX file content
 */
export function parseTCX(content: string): ParsedWorkoutData {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(content, 'text/xml');
  
  const dataPoints: WorkoutDataPoint[] = [];
  let startTime: string | null = null;
  let endTime: string | null = null;
  let totalDistance = 0;
  const heartRates: number[] = [];
  
  // TCX structure: TrainingCenterDatabase -> Activities -> Activity -> Lap -> Track -> Trackpoint
  const trackpoints = xmlDoc.getElementsByTagName('Trackpoint');
  
  for (let i = 0; i < trackpoints.length; i++) {
    const point = trackpoints[i];
    
    // Get time
    const time = point.getElementsByTagName('Time')[0];
    const timestamp = time ? time.textContent || '' : '';
    
    if (timestamp && !startTime) {
      startTime = timestamp;
    }
    if (timestamp) {
      endTime = timestamp;
    }
    
    // Get position (latitude/longitude)
    const position = point.getElementsByTagName('Position')[0];
    let latitude: number | undefined;
    let longitude: number | undefined;
    if (position) {
      const lat = position.getElementsByTagName('LatitudeDegrees')[0];
      const lon = position.getElementsByTagName('LongitudeDegrees')[0];
      latitude = lat ? parseFloat(lat.textContent || '0') : undefined;
      longitude = lon ? parseFloat(lon.textContent || '0') : undefined;
    }
    
    // Get altitude
    const altitude = point.getElementsByTagName('AltitudeMeters')[0];
    const elevation = altitude ? parseFloat(altitude.textContent || '0') : undefined;
    
    // Get heart rate
    const hr = point.getElementsByTagName('HeartRateBpm')[0];
    let heartRate: number | undefined;
    if (hr) {
      const value = hr.getElementsByTagName('Value')[0];
      if (value) {
        heartRate = parseInt(value.textContent || '0', 10);
        if (heartRate && !isNaN(heartRate)) {
          heartRates.push(heartRate);
        }
      }
    }
    
    // Get cadence
    const cadenceEl = point.getElementsByTagName('Cadence')[0];
    const cadence = cadenceEl ? parseInt(cadenceEl.textContent || '0', 10) : undefined;
    
    // Get distance
    const distanceEl = point.getElementsByTagName('DistanceMeters')[0];
    const distance = distanceEl ? parseFloat(distanceEl.textContent || '0') : undefined;
    if (distance) {
      totalDistance = distance; // TCX tracks cumulative distance
    }
    
    dataPoints.push({
      timestamp,
      latitude,
      longitude,
      elevation,
      heartRate,
      distance,
      cadence,
    });
  }
  
  // Calculate average and max heart rate
  const averageHeartRate = heartRates.length > 0
    ? Math.round(heartRates.reduce((a, b) => a + b, 0) / heartRates.length)
    : undefined;
  const maxHeartRate = heartRates.length > 0 ? Math.max(...heartRates) : undefined;
  
  return {
    type: 'tcx',
    startTime: startTime || new Date().toISOString(),
    endTime: endTime || undefined,
    dataPoints,
    totalDistance,
    averageHeartRate,
    maxHeartRate,
  };
}

/**
 * Parse generic XML file (HealthKit export, etc.)
 */
export function parseXML(content: string): ParsedWorkoutData {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(content, 'text/xml');
  
  const dataPoints: WorkoutDataPoint[] = [];
  let startTime: string | null = null;
  
  // Try to find workout data in various formats
  // HealthKit format: HealthData -> Record
  const records = xmlDoc.getElementsByTagName('Record');
  
  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const type = record.getAttribute('type');
    
    // Get timestamp
    const startDate = record.getAttribute('startDate');
    const endDate = record.getAttribute('endDate');
    const timestamp = startDate || '';
    
    if (timestamp && !startTime) {
      startTime = timestamp;
    }
    
    // Extract value based on type
    const value = record.getAttribute('value');
    
    if (type?.includes('HeartRate')) {
      const hr = value ? parseFloat(value) : undefined;
      if (hr && !isNaN(hr)) {
        dataPoints.push({
          timestamp,
          heartRate: hr,
        });
      }
    }
    
    // Add more type handlers as needed
  }
  
  return {
    type: 'xml',
    startTime: startTime || new Date().toISOString(),
    dataPoints,
  };
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Detect file type from filename or content
 */
export function detectFileType(filename: string, content: string): 'gpx' | 'tcx' | 'xml' {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.gpx')) return 'gpx';
  if (lower.endsWith('.tcx')) return 'tcx';
  if (lower.endsWith('.xml')) return 'xml';
  
  // Try to detect from content
  if (content.includes('<gpx')) return 'gpx';
  if (content.includes('TrainingCenterDatabase')) return 'tcx';
  if (content.includes('<?xml')) return 'xml';
  
  return 'xml'; // Default fallback
}

/**
 * Main parse function that routes to appropriate parser
 */
export function parseWorkoutFile(filename: string, content: string): ParsedWorkoutData {
  const fileType = detectFileType(filename, content);
  
  switch (fileType) {
    case 'gpx':
      return parseGPX(content);
    case 'tcx':
      return parseTCX(content);
    case 'xml':
    default:
      return parseXML(content);
  }
}

