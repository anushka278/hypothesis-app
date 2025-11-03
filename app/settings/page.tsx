'use client';

import { useState, useEffect } from 'react';
import { AppSettings } from '@/lib/types';
import { getAppSettings, updateAppSettings } from '@/lib/storage';
import { Bell, Palette, Shield, ChevronRight, Moon, Sun, Link as LinkIcon, Smartphone, Watch, Plus, X, Trash2, Ruler } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { DataSource, ConnectedApp, ConnectedDevice } from '@/lib/types';
import { getDataSources, saveDataSource, deleteDataSource } from '@/lib/storage';
import AppHeader from '@/components/ui/AppHeader';

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState<'app' | 'device' | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const router = useRouter();

  useEffect(() => {
    const savedSettings = getAppSettings();
    setSettings(savedSettings);
    setDataSources(getDataSources());
  }, []);

  const handleToggle = (key: keyof AppSettings, value: any) => {
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

  const handleAddApp = () => {
    if (!newItemName.trim()) return;
    
    const newApp: ConnectedApp = {
      id: `app-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: newItemName.trim(),
      type: 'app',
      appType: 'fitness',
      connectedAt: new Date().toISOString(),
      status: 'connected',
    };
    
    saveDataSource(newApp);
    setDataSources(getDataSources());
    setShowAddModal(false);
    setAddType(null);
    setNewItemName('');
  };

  const handleAddDevice = () => {
    if (!newItemName.trim()) return;
    
    const newDevice: ConnectedDevice = {
      id: `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: newItemName.trim(),
      type: 'device',
      deviceType: 'watch',
      connectedAt: new Date().toISOString(),
      status: 'connected',
    };
    
    saveDataSource(newDevice);
    setDataSources(getDataSources());
    setShowAddModal(false);
    setAddType(null);
    setNewItemName('');
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
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setAddType('app');
                  setShowAddModal(true);
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent)]/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add App</span>
              </button>
              <button
                onClick={() => {
                  setAddType('device');
                  setShowAddModal(true);
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent)]/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Device</span>
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

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">
                Add {addType === 'app' ? 'App' : 'Device'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setAddType(null);
                  setNewItemName('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {addType === 'app' ? 'App' : 'Device'} Name
              </label>
              <input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder={addType === 'app' ? 'e.g., Strava, Runna' : 'e.g., Apple Watch, Fitbit'}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent bg-white dark:bg-gray-700 text-foreground"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addType === 'app' ? handleAddApp() : handleAddDevice();
                  }
                }}
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setAddType(null);
                  setNewItemName('');
                }}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={addType === 'app' ? handleAddApp : handleAddDevice}
                disabled={!newItemName.trim()}
                className="flex-1 px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent)]/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Connect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

