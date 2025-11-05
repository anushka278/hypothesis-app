'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { exchangeFitbitCode, storeToken, fetchFitbitActivities, convertFitbitActivityToDataPoints } from '@/lib/api-clients';
import { saveDataSource, getActiveVariables, saveDataPoint } from '@/lib/storage';
import AppHeader from '@/components/ui/AppHeader';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function FitbitCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      setStatus('error');
      setErrorMessage(error === 'access_denied' 
        ? 'You denied access to your Fitbit account.' 
        : 'An error occurred during authorization.');
      return;
    }

    if (!code) {
      setStatus('error');
      setErrorMessage('No authorization code received.');
      return;
    }

    // Exchange code for token
    (async () => {
      try {
        const tokenData = await exchangeFitbitCode(code);
        
        // Store token
        storeToken('fitbit', tokenData);

        // Save as connected data source
        const dataSource = {
          id: `fitbit-${Date.now()}`,
          name: 'Fitbit',
          type: 'app' as const,
          appType: 'fitness' as const,
          connectedAt: new Date().toISOString(),
          status: 'connected' as const,
        };

        saveDataSource(dataSource);

        // Fetch and sync activities
        try {
          const activities = await fetchFitbitActivities(20);
          
          // Find exercise variable
          const variables = getActiveVariables();
          const exerciseVariable = variables.find(v => 
            v.name.toLowerCase().includes('exercise') || 
            v.name.toLowerCase().includes('workout')
          );

          if (exerciseVariable) {
            // Convert activities to data points
            activities.forEach((activity) => {
              const dataPoints = convertFitbitActivityToDataPoints(activity);
              dataPoints.forEach((dp) => {
                saveDataPoint({
                  ...dp,
                  variableId: exerciseVariable.id,
                });
              });
            });
          }
        } catch (syncError) {
          console.error('Error syncing Fitbit activities:', syncError);
          // Don't fail the connection if sync fails
        }

        setStatus('success');
        
        // Redirect to settings after a short delay
        setTimeout(() => {
          router.push('/settings');
        }, 2000);
      } catch (err: any) {
        console.error('Token exchange error:', err);
        setStatus('error');
        setErrorMessage(err.message || 'Failed to connect Fitbit account.');
      }
    })();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen pb-16">
      <AppHeader />
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="w-12 h-12 text-[var(--accent)] mx-auto mb-4 animate-spin" />
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Connecting Fitbit...
              </h2>
              <p className="text-gray-500">
                Please wait while we connect your account.
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Successfully Connected!
              </h2>
              <p className="text-gray-500 mb-4">
                Your Fitbit account has been connected. Redirecting to settings...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Connection Failed
              </h2>
              <p className="text-gray-500 mb-4">
                {errorMessage}
              </p>
              <button
                onClick={() => router.push('/settings')}
                className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:opacity-90"
              >
                Go to Settings
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

