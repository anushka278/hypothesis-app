'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { exchangeGarminCode, storeToken } from '@/lib/api-clients';
import { saveDataSource } from '@/lib/storage';
import AppHeader from '@/components/ui/AppHeader';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function GarminCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const codeVerifier = sessionStorage.getItem('garmin_code_verifier');

    if (error) {
      setStatus('error');
      setErrorMessage(error === 'access_denied' 
        ? 'You denied access to your Garmin account.' 
        : 'An error occurred during authorization.');
      return;
    }

    if (!code) {
      setStatus('error');
      setErrorMessage('No authorization code received.');
      return;
    }

    if (!codeVerifier) {
      setStatus('error');
      setErrorMessage('Code verifier not found. Please try connecting again.');
      return;
    }

    // Exchange code for token
    (async () => {
      try {
        const tokenData = await exchangeGarminCode(code, codeVerifier);
        
        // Store token
        storeToken('garmin', tokenData);

        // Save as connected data source
        const dataSource = {
          id: `garmin-${Date.now()}`,
          name: 'Garmin Connect',
          type: 'app' as const,
          appType: 'fitness' as const,
          connectedAt: new Date().toISOString(),
          status: 'connected' as const,
        };

        saveDataSource(dataSource);

        // Clear code verifier from session storage
        sessionStorage.removeItem('garmin_code_verifier');

        setStatus('success');
        
        // Redirect to settings after a short delay
        setTimeout(() => {
          router.push('/settings');
        }, 3000);
      } catch (err: any) {
        console.error('Token exchange error:', err);
        setStatus('error');
        setErrorMessage(err.message || 'Failed to connect Garmin account.');
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
                Connecting Garmin Connect...
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
                Garmin Connect is successfully linked! Your activities will appear on the 'Track' page automatically as you sync your device.
              </p>
              <p className="text-sm text-gray-400 mb-4">
                Redirecting to settings...
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

