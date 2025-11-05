import { NextRequest, NextResponse } from 'next/server';
import { getDataSources, saveDataPoint, getActiveVariables } from '@/lib/storage';

/**
 * Garmin Webhook Receiver Endpoint
 * This endpoint receives POST requests from Garmin when activities are synced
 * 
 * To configure: Provide this URL to Garmin in your developer portal:
 * https://your-domain.com/api/garmin-webhook
 */
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    
    console.log('Garmin webhook received:', JSON.stringify(payload, null, 2));

    // Garmin webhook payload structure varies by event type
    // Common types: activity-summary, daily-summary, etc.
    const eventType = payload.eventType || payload.type;
    
    // Find connected Garmin data source
    const dataSources = getDataSources();
    const garminSource = dataSources.find(
      source => source.name.toLowerCase().includes('garmin')
    );

    if (!garminSource) {
      console.warn('Garmin webhook received but no connected Garmin account found');
      // Still return 200 to acknowledge receipt
      return NextResponse.json({ received: true });
    }

    // Get exercise variable to save data to
    const variables = getActiveVariables();
    const exerciseVariable = variables.find(v => 
      v.name.toLowerCase().includes('exercise') || 
      v.name.toLowerCase().includes('workout')
    );

    if (!exerciseVariable) {
      console.warn('Garmin webhook received but no exercise variable found');
      return NextResponse.json({ received: true });
    }

    // Parse different Garmin webhook event types
    if (eventType === 'activity-summary' || payload.activitySummary) {
      const activity = payload.activitySummary || payload;
      
      // Extract activity data
      const startTime = activity.startTime || activity.startTimeGMT || activity.startTimeInSeconds;
      const duration = activity.duration || activity.durationInSeconds || 0;
      const distance = activity.distance || activity.distanceInMeters || 0;
      const calories = activity.calories || 0;
      const averageHeartRate = activity.averageHeartRate || activity.avgHeartRate || undefined;
      const maxHeartRate = activity.maxHeartRate || undefined;
      const activityType = activity.activityType || activity.activityName || 'exercise';
      const elevationGain = activity.elevationGain || activity.totalElevationGain || undefined;

      // Determine exercise type
      let exerciseType = 'exercise';
      const activityTypeLower = activityType.toLowerCase();
      if (activityTypeLower.includes('run') || activityTypeLower.includes('running')) {
        exerciseType = 'running';
      } else if (activityTypeLower.includes('bike') || activityTypeLower.includes('cycling') || activityTypeLower.includes('ride')) {
        exerciseType = 'cycling';
      } else if (activityTypeLower.includes('swim') || activityTypeLower.includes('swimming')) {
        exerciseType = 'swimming';
      } else if (activityTypeLower.includes('walk') || activityTypeLower.includes('walking')) {
        exerciseType = 'walking';
      }

      // Create data point
      const dataPoint = {
        id: `dp-garmin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        variableId: exerciseVariable.id,
        value: distance > 0 ? distance / 1000 : 1, // Convert meters to km or use 1 for binary
        date: startTime ? new Date(startTime).toISOString() : new Date().toISOString(),
        metadata: {
          exerciseType,
          duration, // seconds
          distance, // meters
          calories,
          averageHeartRate,
          maxHeartRate,
          elevationGain,
          source: 'garmin',
        },
      };

      saveDataPoint(dataPoint);
      console.log('Saved Garmin activity:', dataPoint);
    } 
    else if (eventType === 'daily-summary' || payload.dailySummary) {
      const daily = payload.dailySummary || payload;
      
      // Daily summary might include step count, sleep, etc.
      // For now, we'll focus on activities within the daily summary
      if (daily.activities) {
        daily.activities.forEach((activity: any) => {
          const startTime = activity.startTime || activity.startTimeGMT;
          const duration = activity.duration || activity.durationInSeconds || 0;
          const distance = activity.distance || activity.distanceInMeters || 0;
          const activityType = activity.activityType || activity.activityName || 'exercise';

          let exerciseType = 'exercise';
          const activityTypeLower = activityType.toLowerCase();
          if (activityTypeLower.includes('run')) {
            exerciseType = 'running';
          } else if (activityTypeLower.includes('bike') || activityTypeLower.includes('cycling')) {
            exerciseType = 'cycling';
          } else if (activityTypeLower.includes('swim')) {
            exerciseType = 'swimming';
          }

          const dataPoint = {
            id: `dp-garmin-daily-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            variableId: exerciseVariable.id,
            value: distance > 0 ? distance / 1000 : 1,
            date: startTime ? new Date(startTime).toISOString() : new Date().toISOString(),
            metadata: {
              exerciseType,
              duration,
              distance,
              source: 'garmin',
            },
          };

          saveDataPoint(dataPoint);
        });
      }
    }
    else {
      // Handle other event types or generic payload
      console.log('Unhandled Garmin webhook event type:', eventType);
    }

    // Always return 200 OK to acknowledge receipt
    return NextResponse.json({ 
      received: true,
      eventType,
      processed: true 
    });
  } catch (error) {
    console.error('Error processing Garmin webhook:', error);
    
    // Still return 200 to prevent Garmin from retrying
    // But log the error for debugging
    return NextResponse.json(
      { received: true, error: 'Processing error' },
      { status: 200 }
    );
  }
}

// Also handle GET requests (for webhook verification/health checks)
export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    message: 'Garmin webhook endpoint is active',
    endpoint: '/api/garmin-webhook'
  });
}

