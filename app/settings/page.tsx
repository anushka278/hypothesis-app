'use client';

import { useState, useEffect } from 'react';
import { AppSettings } from '@/lib/types';
import { getAppSettings, updateAppSettings } from '@/lib/storage';
import { Bell, Palette, Shield, ChevronRight, Moon, Sun, Link as LinkIcon, Smartphone, Watch, Plus, X, Trash2, Ruler, Upload, Loader2, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { DataSource, ConnectedApp, ConnectedDevice } from '@/lib/types';
import { getDataSources, saveDataSource, deleteDataSource } from '@/lib/storage';
import AppHeader from '@/components/ui/AppHeader';
import { requestNotificationPermission, restartNotificationScheduler } from '@/lib/notifications';
import { parseWorkoutFile } from '@/lib/file-parsers';
import { getStravaAuthUrl, getFitbitAuthUrl, getGarminAuthUrl, generateCodeVerifier } from '@/lib/api-clients';
import { saveDataPoint, getActiveVariables } from '@/lib/storage';

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState<'app' | 'device' | 'upload' | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [showAppSelection, setShowAppSelection] = useState(false);
  const [showDeviceSelection, setShowDeviceSelection] = useState(false);
  const [showSuggestApp, setShowSuggestApp] = useState(false);
  const [suggestedAppName, setSuggestedAppName] = useState('');
  const [isSubmittingSuggestion, setIsSubmittingSuggestion] = useState(false);
  const [showSuggestionConfirmation, setShowSuggestionConfirmation] = useState(false);
  const [confirmedAppName, setConfirmedAppName] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    const savedSettings = getAppSettings();
    setSettings(savedSettings);
    setDataSources(getDataSources());
    
    // Request notification permission if notifications are enabled
    if (savedSettings.notifications.enabled && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        requestNotificationPermission();
      }
    }
  }, []);

  const handleToggle = async (key: keyof AppSettings, value: any) => {
    if (!settings) return;
    
    const updates: any = {};
    if (key === 'notifications') {
      updates.notifications = { ...settings.notifications, ...value };
    } else if (key === 'dataPrivacy') {
      updates.dataPrivacy = { ...settings.dataPrivacy, ...value };
    } else {
      updates[key] = value;
    }
    
    const updated = updateAppSettings(updates);
    setSettings(updated);
    
    // Handle notification permission and restart scheduler
    if (key === 'notifications') {
      // Request permission if notifications are being enabled
      if (updated.notifications.enabled) {
        const permission = await requestNotificationPermission();
        if (permission === 'denied') {
          // If permission was denied, disable notifications
          const deniedSettings = updateAppSettings({ 
            notifications: { ...updated.notifications, enabled: false } 
          });
          setSettings(deniedSettings);
          alert('Notification permission was denied. Please enable it in your browser settings to use reminders.');
          return;
        }
      }
      // Restart scheduler when notification settings change
      restartNotificationScheduler();
    }
    
    // Apply color scheme immediately
    if (key === 'colorScheme') {
      applyColorScheme(value);
    }
    if (key === 'accentColor') {
      applyAccentColor(value);
    }
    // Units changes don't need immediate visual updates, but trigger a refresh
    if (key === 'units') {
      // Force a page refresh to update profile page units
      window.dispatchEvent(new Event('storage'));
    }
  };

  const applyColorScheme = (scheme: 'light' | 'dark') => {
    const html = document.documentElement;
    if (scheme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  };

  const applyAccentColor = (color: 'teal' | 'red' | 'brown' | 'baby-blue' | 'black' | 'orange') => {
    const html = document.documentElement;
    html.setAttribute('data-accent', color);
  };

  useEffect(() => {
    if (settings) {
      applyColorScheme(settings.colorScheme);
      applyAccentColor(settings.accentColor);
    }
  }, [settings]);

  if (!settings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  const handleConnectStrava = () => {
    const clientId = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID || 'your-client-id';
    const authUrl = getStravaAuthUrl(clientId);
    window.location.href = authUrl;
  };

  const handleConnectFitbit = () => {
    const clientId = process.env.NEXT_PUBLIC_FITBIT_CLIENT_ID || 'your-client-id';
    const authUrl = getFitbitAuthUrl(clientId);
    window.location.href = authUrl;
  };

  const handleConnectGarmin = async () => {
    const clientId = process.env.NEXT_PUBLIC_GARMIN_CLIENT_ID || 'your-client-id';
    
    // Generate PKCE code verifier and challenge
    const codeVerifier = generateCodeVerifier();
    
    // Store code verifier in session storage for later use in callback
    sessionStorage.setItem('garmin_code_verifier', codeVerifier);
    
    // Generate authorization URL with PKCE
    const authUrl = await getGarminAuthUrl(clientId, codeVerifier);
    window.location.href = authUrl;
  };

  const handleSuggestApp = () => {
    setShowAppSelection(false);
    setShowSuggestApp(true);
  };

  const handleSubmitSuggestion = async () => {
    if (!suggestedAppName.trim()) return;

    setIsSubmittingSuggestion(true);

    try {
      const response = await fetch('/api/suggest-app', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appName: suggestedAppName.trim(),
          appId: 'default', // You can customize this per deployment
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit suggestion');
      }

      // Close suggest modal and show confirmation
      setShowSuggestApp(false);
      setConfirmedAppName(suggestedAppName.trim());
      setSuggestedAppName('');
      setShowSuggestionConfirmation(true);

      // Auto-hide confirmation after 5 seconds
      setTimeout(() => {
        setShowSuggestionConfirmation(false);
      }, 5000);
    } catch (error) {
      console.error('Error submitting suggestion:', error);
      alert('Failed to submit suggestion. Please try again.');
    } finally {
      setIsSubmittingSuggestion(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    setUploadError('');

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const parsedData = parseWorkoutFile(file.name, content);

        // Find or create exercise variable
        const variables = getActiveVariables();
        let exerciseVariable = variables.find(v => 
          v.name.toLowerCase().includes('exercise') || 
          v.name.toLowerCase().includes('workout')
        );

        if (!exerciseVariable) {
          // Create a default exercise variable if none exists
          alert('No exercise variable found. Please create a hypothesis with exercise tracking first.');
          setUploadingFile(false);
          return;
        }

        // Save data points from the parsed workout
        parsedData.dataPoints.forEach((point, index) => {
          if (point.timestamp) {
            const dataPoint = {
              id: `dp-upload-${Date.now()}-${index}`,
              variableId: exerciseVariable!.id,
              value: point.distance ? point.distance / 1000 : 1, // Convert meters to km or use 1 for binary
              date: new Date(point.timestamp).toISOString(),
              metadata: {
                exerciseType: 'uploaded',
                duration: parsedData.dataPoints.length * 60, // Estimate
                distance: point.distance,
                averageHeartRate: parsedData.averageHeartRate,
                maxHeartRate: parsedData.maxHeartRate,
                elevation: point.elevation,
                latitude: point.latitude,
                longitude: point.longitude,
              },
            };
            saveDataPoint(dataPoint);
          }
        });

        alert(`Successfully imported ${parsedData.dataPoints.length} data points from ${file.name}`);
        setUploadingFile(false);
        // Reset file input
        event.target.value = '';
      } catch (error) {
        console.error('File parsing error:', error);
        setUploadError('Failed to parse file. Please ensure it is a valid GPX, TCX, or XML file.');
        setUploadingFile(false);
      }
    };

    reader.onerror = () => {
      setUploadError('Failed to read file.');
      setUploadingFile(false);
    };

    reader.readAsText(file);
  };

  const handleDeleteSource = (id: string) => {
    if (confirm('Are you sure you want to disconnect this? Variables linked to it will be unlinked.')) {
      deleteDataSource(id);
      setDataSources(getDataSources());
    }
  };

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="min-h-screen pb-16 dark:bg-gray-900">
      <AppHeader />
      <div className="px-4 py-2">
        <button
          onClick={() => router.back()}
          className="text-gray-700 dark:text-gray-300 text-sm hover:underline"
        >
          ← Back
        </button>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* App Notifications */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-3">
            <Bell className="w-5 h-5 text-[var(--accent)]" />
            <h2 className="text-lg font-semibold text-foreground">App Notifications</h2>
          </div>
          
          <div className="px-6 py-4 space-y-4">
            {/* Enable Notifications Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Enable Notifications</p>
                <p className="text-sm text-gray-500">Receive reminders to log your data</p>
              </div>
              <button
                onClick={() => handleToggle('notifications', { enabled: !settings.notifications.enabled })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.notifications.enabled ? 'bg-[var(--accent)]' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.notifications.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {settings.notifications.enabled && (
              <>
                {/* Reminder Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reminder Time
                  </label>
                  <input
                    type="time"
                    value={settings.notifications.reminderTime || '20:00'}
                    onChange={(e) => handleToggle('notifications', { reminderTime: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent bg-white dark:bg-gray-700 text-foreground"
                  />
                </div>

                {/* Reminder Days */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reminder Days
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {daysOfWeek.map((day, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          const currentDays = settings.notifications.reminderDays || [];
                          const newDays = currentDays.includes(index)
                            ? currentDays.filter(d => d !== index)
                            : [...currentDays, index];
                          handleToggle('notifications', { reminderDays: newDays });
                        }}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          settings.notifications.reminderDays?.includes(index)
                            ? 'bg-[var(--accent)] text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {day.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Connect My Data */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
            <LinkIcon className="w-5 h-5 text-[var(--accent)]" />
            <h2 className="text-lg font-semibold text-foreground">Connect My Data</h2>
          </div>
          
          <div className="px-6 py-4 space-y-4">
            {/* Connected Sources List */}
            {dataSources.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No apps or devices connected yet
              </p>
            ) : (
              <div className="space-y-3">
                {dataSources.map((source) => (
                  <div
                    key={source.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {source.type === 'app' ? (
                        <Smartphone className="w-5 h-5 text-[var(--accent)]" />
                      ) : (
                        <Watch className="w-5 h-5 text-[var(--accent)]" />
                      )}
                      <div>
                        <p className="font-medium text-foreground">{source.name}</p>
                        <p className="text-xs text-gray-500 capitalize">
                          {source.type === 'app' ? 'App' : 'Device'} • {source.status}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteSource(source.id)}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                      title="Disconnect"
                    >
                      <Trash2 className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Buttons */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              <button
                onClick={() => setShowAppSelection(true)}
                className="flex flex-col items-center justify-center gap-2 px-3 py-3 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent)]/90 transition-colors"
              >
                <Smartphone className="w-5 h-5" />
                <span className="text-xs">Add App</span>
              </button>
              <button
                onClick={() => setShowDeviceSelection(true)}
                className="flex flex-col items-center justify-center gap-2 px-3 py-3 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent)]/90 transition-colors"
              >
                <Watch className="w-5 h-5" />
                <span className="text-xs">Add Device</span>
              </button>
              <button
                onClick={() => {
                  setAddType('upload');
                  setShowAddModal(true);
                }}
                className="flex flex-col items-center justify-center gap-2 px-3 py-3 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent)]/90 transition-colors"
              >
                <Upload className="w-5 h-5" />
                <span className="text-xs">Upload Data</span>
              </button>
            </div>
          </div>
        </div>

        {/* App Layout */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
            <Palette className="w-5 h-5 text-[var(--accent)]" />
            <h2 className="text-lg font-semibold text-foreground">App Layout</h2>
          </div>
          
          <div className="px-6 py-4 space-y-6">
            {/* Theme */}
            <div>
              <p className="font-medium text-foreground mb-3">Theme</p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleToggle('colorScheme', 'light')}
                  className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                    settings.colorScheme === 'light'
                      ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                  }`}
                >
                  <Sun className={`w-6 h-6 ${settings.colorScheme === 'light' ? 'text-[var(--accent)]' : 'text-gray-400'}`} />
                  <span className={`font-medium ${settings.colorScheme === 'light' ? 'text-[var(--accent)]' : 'text-gray-600 dark:text-gray-400'}`}>
                    Light
                  </span>
                </button>
                
                <button
                  onClick={() => handleToggle('colorScheme', 'dark')}
                  className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                    settings.colorScheme === 'dark'
                      ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                  }`}
                >
                  <Moon className={`w-6 h-6 ${settings.colorScheme === 'dark' ? 'text-[var(--accent)]' : 'text-gray-400'}`} />
                  <span className={`font-medium ${settings.colorScheme === 'dark' ? 'text-[var(--accent)]' : 'text-gray-600 dark:text-gray-400'}`}>
                    Dark
                  </span>
                </button>
              </div>
            </div>

            {/* Accent Color */}
            <div>
              <p className="font-medium text-foreground mb-3">Color</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'red', label: 'Red', color: '#EF4444' },
                  { value: 'orange', label: 'Orange', color: '#FB923C' },
                  { value: 'baby-blue', label: 'Baby Blue', color: '#60A5FA' },
                  { value: 'teal', label: 'Teal', color: '#6CC5A1' },
                  { value: 'brown', label: 'Brown', color: '#92400E' },
                  { value: 'black', label: 'Black', color: '#000000' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleToggle('accentColor', option.value)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                      settings.accentColor === option.value
                        ? 'border-gray-800 dark:border-gray-300 bg-gray-100 dark:bg-gray-700'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-full"
                      style={{ backgroundColor: option.color }}
                    />
                    <span className={`text-xs font-medium ${
                      settings.accentColor === option.value 
                        ? 'text-foreground' 
                        : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {option.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Units of Measure */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
            <Ruler className="w-5 h-5 text-[var(--accent)]" />
            <h2 className="text-lg font-semibold text-foreground">Units of Measure</h2>
          </div>
          
          <div className="px-6 py-4">
            <div className="flex gap-3">
              <button
                onClick={() => handleToggle('units', 'metric')}
                className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                  settings.units === 'metric'
                    ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                }`}
              >
                <span className={`font-medium ${settings.units === 'metric' ? 'text-[var(--accent)]' : 'text-gray-600 dark:text-gray-400'}`}>
                  Metric
                </span>
                <span className="text-xs text-gray-500">cm, kg</span>
              </button>
              
              <button
                onClick={() => handleToggle('units', 'imperial')}
                className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                  settings.units === 'imperial'
                    ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                }`}
              >
                <span className={`font-medium ${settings.units === 'imperial' ? 'text-[var(--accent)]' : 'text-gray-600 dark:text-gray-400'}`}>
                  Imperial
                </span>
                <span className="text-xs text-gray-500">ft/in, lbs</span>
              </button>
            </div>
          </div>
        </div>

        {/* Data Privacy */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
            <Shield className="w-5 h-5 text-[var(--accent)]" />
            <h2 className="text-lg font-semibold text-foreground">Data Privacy</h2>
          </div>
          
          <div className="px-6 py-4 space-y-4">
            {/* Share Analytics */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Share Analytics</p>
                <p className="text-sm text-gray-500">Help improve the app anonymously</p>
              </div>
              <button
                onClick={() => handleToggle('dataPrivacy', { shareAnalytics: !settings.dataPrivacy.shareAnalytics })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.dataPrivacy.shareAnalytics ? 'bg-[var(--accent)]' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.dataPrivacy.shareAnalytics ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Allow Data Export */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Allow Data Export</p>
                <p className="text-sm text-gray-500">Export your data as JSON or CSV</p>
              </div>
              <button
                onClick={() => handleToggle('dataPrivacy', { allowDataExport: !settings.dataPrivacy.allowDataExport })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.dataPrivacy.allowDataExport ? 'bg-[var(--accent)]' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.dataPrivacy.allowDataExport ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Auto Backup */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Auto Backup</p>
                <p className="text-sm text-gray-500">Automatically backup your data</p>
              </div>
              <button
                onClick={() => handleToggle('dataPrivacy', { autoBackup: !settings.dataPrivacy.autoBackup })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.dataPrivacy.autoBackup ? 'bg-[var(--accent)]' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.dataPrivacy.autoBackup ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Data Modal */}
      {showAddModal && addType === 'upload' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Upload Data</h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setAddType(null);
                  setUploadError('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select workout file (GPX, TCX, or XML)
              </label>
              <input
                type="file"
                accept=".gpx,.tcx,.xml"
                onChange={handleFileUpload}
                disabled={uploadingFile}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent bg-white dark:bg-gray-700 text-foreground"
              />
              {uploadingFile && (
                <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing file...</span>
                </div>
              )}
              {uploadError && (
                <p className="mt-2 text-sm text-red-500">{uploadError}</p>
              )}
              <p className="mt-2 text-xs text-gray-500">
                Supported formats: GPX, TCX, XML. Files will be parsed for workout data including heart rate, distance, and timestamps.
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setAddType(null);
                  setUploadError('');
                }}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* App Selection Modal */}
      {showAppSelection && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Connect an App</h3>
              <button
                onClick={() => setShowAppSelection(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={handleConnectStrava}
                className="w-full flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold">
                  S
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-foreground">Strava</p>
                  <p className="text-xs text-gray-500">Connect your Strava account to sync activities</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>

              <button
                onClick={handleConnectFitbit}
                className="w-full flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold">
                  F
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-foreground">Fitbit</p>
                  <p className="text-xs text-gray-500">Connect your Fitbit account to sync activities</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>

              <button
                onClick={handleConnectGarmin}
                className="w-full flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center text-white font-bold">
                  G
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-foreground">Garmin Connect</p>
                  <p className="text-xs text-gray-500">Connect your Garmin account to sync activities</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>

              <button
                onClick={handleSuggestApp}
                className="w-full flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="w-10 h-10 bg-gray-500 rounded-lg flex items-center justify-center text-white font-bold">
                  +
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-foreground">Suggest an App...</p>
                  <p className="text-xs text-gray-500">Request a new app integration</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suggest App Modal */}
      {showSuggestApp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Suggest an App</h3>
              <button
                onClick={() => {
                  setShowSuggestApp(false);
                  setSuggestedAppName('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                What app would you like us to add?
              </label>
              <input
                type="text"
                value={suggestedAppName}
                onChange={(e) => setSuggestedAppName(e.target.value)}
                placeholder="e.g., Whoop, Oura, MyFitnessPal"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent bg-white dark:bg-gray-700 text-foreground"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && suggestedAppName.trim()) {
                    handleSubmitSuggestion();
                  }
                }}
                disabled={isSubmittingSuggestion}
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSuggestApp(false);
                  setSuggestedAppName('');
                }}
                disabled={isSubmittingSuggestion}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitSuggestion}
                disabled={!suggestedAppName.trim() || isSubmittingSuggestion}
                className="flex-1 px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent)]/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmittingSuggestion ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </span>
                ) : (
                  'Submit Suggestion'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suggestion Confirmation Toast */}
      {showSuggestionConfirmation && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-foreground mb-2">Thank you for the suggestion!</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  We're always working to add new connections.
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  In the meantime, most apps (including <strong>{confirmedAppName}</strong>) allow you to export your data. You can use our <strong>'Upload Data'</strong> feature to import your .gpx or .tcx files.
                </p>
              </div>
              <button
                onClick={() => setShowSuggestionConfirmation(false)}
                className="text-gray-400 hover:text-gray-600 flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Device Selection Modal */}
      {showDeviceSelection && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Connect a Device</h3>
              <button
                onClick={() => setShowDeviceSelection(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                <div className="flex items-start gap-3 mb-3">
                  <Watch className="w-6 h-6 text-[var(--accent)] mt-1" />
                  <div className="flex-1">
                    <p className="font-medium text-foreground mb-1">Apple Watch</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      To sync your Apple Watch data:
                    </p>
                  </div>
                </div>
                <div className="ml-9 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <p>• Export your workout from the Apple Health app as an XML file</p>
                  <p>• Use the "Upload Data" option to import the file</p>
                  <p>• Or connect to Strava (if you sync your Apple Watch to Strava) via "Add App"</p>
                </div>
              </div>

              <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                <div className="flex items-start gap-3 mb-3">
                  <Watch className="w-6 h-6 text-[var(--accent)] mt-1" />
                  <div className="flex-1">
                    <p className="font-medium text-foreground mb-1">Whoop</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      To sync your Whoop data:
                    </p>
                  </div>
                </div>
                <div className="ml-9 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <p>• Export your workout data from the Whoop app</p>
                  <p>• Use the "Upload Data" option to import GPX or TCX files</p>
                  <p>• Or connect to Strava if you sync Whoop to Strava</p>
                </div>
              </div>

              <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                <div className="flex items-start gap-3 mb-3">
                  <Watch className="w-6 h-6 text-[var(--accent)] mt-1" />
                  <div className="flex-1">
                    <p className="font-medium text-foreground mb-1">Oura Ring</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      To sync your Oura Ring data:
                    </p>
                  </div>
                </div>
                <div className="ml-9 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <p>• Export your workout data from the Oura app</p>
                  <p>• Use the "Upload Data" option to import the exported files</p>
                </div>
              </div>

              <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                <div className="flex items-start gap-3 mb-3">
                  <Watch className="w-6 h-6 text-[var(--accent)] mt-1" />
                  <div className="flex-1">
                    <p className="font-medium text-foreground mb-1">Other Devices</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      For other fitness trackers:
                    </p>
                  </div>
                </div>
                <div className="ml-9 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <p>• Check if your device syncs with Strava, Fitbit, or Garmin Connect</p>
                  <p>• Connect via "Add App" if available</p>
                  <p>• Otherwise, export your data and use "Upload Data"</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

