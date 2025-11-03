'use client';

import { useState, useEffect } from 'react';
import { UserProfile, ProfileCategory } from '@/lib/types';
import { getUserProfile, updateUserProfile, saveUserProfile, getAppSettings } from '@/lib/storage';
import { User, Settings, Camera, Edit2, CheckSquare, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import AppHeader from '@/components/ui/AppHeader';

const ALL_CATEGORIES: { key: ProfileCategory; label: string }[] = [
  { key: 'age', label: 'Age' },
  { key: 'gender', label: 'Gender' },
  { key: 'height', label: 'Height' },
  { key: 'weight', label: 'Weight' },
  { key: 'diet', label: 'Diet' },
  { key: 'race', label: 'Race' },
  { key: 'allergies', label: 'Allergies' },
  { key: 'medications', label: 'Medications' },
  { key: 'medicalConditions', label: 'Medical Conditions' },
];

const BASIC_CATEGORIES = ['name', 'age', 'height', 'weight'] as const;

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<UserProfile>>({});
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [units, setUnits] = useState<'metric' | 'imperial'>('metric');
  const router = useRouter();

  useEffect(() => {
    const settings = getAppSettings();
    setUnits(settings.units);
    
    // Listen for storage changes (when units are updated in settings)
    const handleStorageChange = () => {
      const updatedSettings = getAppSettings();
      setUnits(updatedSettings.units);
    };
    
    window.addEventListener('storage', handleStorageChange);
    // Also check periodically (for same-tab updates)
    const interval = setInterval(() => {
      const updatedSettings = getAppSettings();
      const currentUnits = updatedSettings.units;
      setUnits(prevUnits => {
        if (prevUnits !== currentUnits) {
          return currentUnits;
        }
        return prevUnits;
      });
    }, 500);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const savedProfile = getUserProfile();
    if (savedProfile) {
      setProfile(savedProfile);
    } else {
      // Initialize with default profile
      const defaultProfile: UserProfile = {
        id: `profile-${Date.now()}`,
        name: '',
        enabledCategories: ['age', 'height', 'weight'],
        visibilitySettings: {
          name: true,
          age: true,
          height: true,
          weight: true,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setProfile(defaultProfile);
      saveUserProfile(defaultProfile);
    }
  }, []);

  const handleEdit = () => {
    setIsEditing(true);
    setEditedProfile({
      name: profile?.name || '',
      age: profile?.age,
      height: profile?.height,
      weight: profile?.weight,
      gender: profile?.gender,
      diet: profile?.diet,
      race: profile?.race,
      allergies: profile?.allergies,
      medications: profile?.medications,
      medicalConditions: profile?.medicalConditions,
      profilePicture: profile?.profilePicture,
      enabledCategories: profile?.enabledCategories || [],
      visibilitySettings: profile?.visibilitySettings || {},
    });
  };

  const handleSave = () => {
    if (profile) {
      const updated = updateUserProfile({
        ...profile,
        ...editedProfile,
      });
      setProfile(updated);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedProfile({});
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const updates = { ...editedProfile, profilePicture: base64String };
        setEditedProfile(updates);
        // If not in edit mode, enter edit mode and save immediately
        if (!isEditing) {
          setIsEditing(true);
          if (profile) {
            updateUserProfile({ ...profile, profilePicture: base64String });
            setProfile({ ...profile, profilePicture: base64String });
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Convert cm to feet/inches
  const cmToFeetInches = (cm: number) => {
    const totalInches = cm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return { feet, inches };
  };

  // Convert feet/inches to cm
  const feetInchesToCm = (feet: number, inches: number) => {
    return (feet * 12 + inches) * 2.54;
  };

  // Convert kg to lbs
  const kgToLbs = (kg: number) => kg * 2.20462;
  
  // Convert lbs to kg
  const lbsToKg = (lbs: number) => lbs / 2.20462;

  const formatHeight = (cm?: number) => {
    if (!cm) return '';
    if (units === 'imperial') {
      const { feet, inches } = cmToFeetInches(cm);
      return `${feet}'${inches}"`;
    }
    return `${cm} cm`;
  };

  const formatWeight = (kg?: number) => {
    if (!kg) return '';
    if (units === 'imperial') {
      return `${Math.round(kgToLbs(kg))} lbs`;
    }
    return `${kg} kg`;
  };

  const toggleCategory = (category: ProfileCategory) => {
    const current = editedProfile.enabledCategories || profile?.enabledCategories || [];
    if (current.includes(category)) {
      setEditedProfile({
        ...editedProfile,
        enabledCategories: current.filter(c => c !== category),
      });
    } else {
      setEditedProfile({
        ...editedProfile,
        enabledCategories: [...current, category],
      });
    }
  };

  const toggleVisibility = (category: typeof BASIC_CATEGORIES[number] | ProfileCategory) => {
    setEditedProfile({
      ...editedProfile,
      visibilitySettings: {
        ...editedProfile.visibilitySettings,
        [category]: !(editedProfile.visibilitySettings?.[category] ?? profile?.visibilitySettings?.[category] ?? true),
      },
    });
  };

  const getCategoryValue = (category: ProfileCategory): string | number | undefined => {
    return editedProfile[category] ?? profile?.[category];
  };

  const shouldShowCategory = (category: typeof BASIC_CATEGORIES[number] | ProfileCategory): boolean => {
    const visibility = editedProfile.visibilitySettings?.[category] ?? profile?.visibilitySettings?.[category];
    return visibility !== false; // Default to true if not set
  };

  const isCategoryEnabled = (category: ProfileCategory): boolean => {
    const enabled = editedProfile.enabledCategories ?? profile?.enabledCategories ?? [];
    return enabled.includes(category);
  };

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16 dark:bg-gray-900">
      <AppHeader />

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Profile Picture Section */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-[var(--accent)]/20 flex items-center justify-center overflow-hidden border-4 border-[var(--accent)]">
              {profile.profilePicture ? (
                <img
                  src={profile.profilePicture}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-16 h-16 text-[var(--accent)]" />
              )}
            </div>
            <label className="absolute bottom-0 right-0 bg-[var(--accent)] text-white rounded-full p-2 cursor-pointer hover:bg-[var(--accent)]/90 transition-colors shadow-lg">
              <Camera className="w-4 h-4" />
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Profile Information */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4">
          {/* Name - Always visible in edit mode, conditional in view mode */}
          {(isEditing || shouldShowCategory('name')) && (
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                Name
                {isEditing && (
                  <label className="ml-3 text-xs font-normal text-gray-500 flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={shouldShowCategory('name')}
                      onChange={() => toggleVisibility('name')}
                      className="mr-1"
                    />
                    Show on profile
                  </label>
                )}
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedProfile.name || ''}
                  onChange={(e) => setEditedProfile({ ...editedProfile, name: e.target.value })}
                  placeholder="Enter your name"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent bg-white dark:bg-gray-700 text-foreground"
                />
              ) : (
                <div className="text-lg font-semibold text-foreground">
                  {profile.name || 'Not set'}
                </div>
              )}
            </div>
          )}

          {/* Age */}
          {isEditing && isCategoryEnabled('age') && (
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                Age
                <label className="ml-3 text-xs font-normal text-gray-500 flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shouldShowCategory('age')}
                    onChange={() => toggleVisibility('age')}
                    className="mr-1"
                  />
                  Show on profile
                </label>
              </label>
              <input
                type="number"
                value={editedProfile.age || ''}
                onChange={(e) => setEditedProfile({ ...editedProfile, age: e.target.value ? parseInt(e.target.value) : undefined })}
                placeholder="Enter your age"
                min="1"
                max="120"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent bg-white dark:bg-gray-700 text-foreground"
              />
            </div>
          )}
          {!isEditing && shouldShowCategory('age') && (
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 block">Age</label>
              <div className="text-lg text-foreground">
                {profile.age ? `${profile.age} years old` : 'Not set'}
              </div>
            </div>
          )}

          {/* Height */}
          {isEditing && isCategoryEnabled('height') && (
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                Height
                <label className="ml-3 text-xs font-normal text-gray-500 flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shouldShowCategory('height')}
                    onChange={() => toggleVisibility('height')}
                    className="mr-1"
                  />
                  Show on profile
                </label>
              </label>
              {units === 'imperial' ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={(editedProfile.height ?? profile?.height) ? cmToFeetInches(editedProfile.height ?? profile?.height ?? 0).feet : ''}
                    onChange={(e) => {
                      const feet = e.target.value ? parseInt(e.target.value) : 0;
                      const currentHeight = editedProfile.height ?? profile?.height ?? 0;
                      const inches = currentHeight ? cmToFeetInches(currentHeight).inches : 0;
                      const cm = feetInchesToCm(feet, inches);
                      setEditedProfile({ ...editedProfile, height: cm });
                    }}
                    placeholder="Feet"
                    min="3"
                    max="8"
                    className="w-24 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent bg-white dark:bg-gray-700 text-foreground"
                  />
                  <span className="text-gray-500 text-sm">ft</span>
                  <input
                    type="number"
                    value={(editedProfile.height ?? profile?.height) ? cmToFeetInches(editedProfile.height ?? profile?.height ?? 0).inches : ''}
                    onChange={(e) => {
                      const inches = e.target.value ? parseInt(e.target.value) : 0;
                      const currentHeight = editedProfile.height ?? profile?.height ?? 0;
                      const feet = currentHeight ? cmToFeetInches(currentHeight).feet : 5;
                      const cm = feetInchesToCm(feet, inches);
                      setEditedProfile({ ...editedProfile, height: cm });
                    }}
                    placeholder="Inches"
                    min="0"
                    max="11"
                    className="w-24 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent bg-white dark:bg-gray-700 text-foreground"
                  />
                  <span className="text-gray-500 text-sm">in</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={editedProfile.height || ''}
                    onChange={(e) => setEditedProfile({ ...editedProfile, height: e.target.value ? parseFloat(e.target.value) : undefined })}
                    placeholder="Height in cm"
                    min="50"
                    max="250"
                    step="0.1"
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent bg-white dark:bg-gray-700 text-foreground"
                  />
                  <span className="text-gray-500 text-sm">cm</span>
                </div>
              )}
            </div>
          )}
          {!isEditing && shouldShowCategory('height') && (
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 block">Height</label>
              <div className="text-lg text-foreground">
                {profile.height ? formatHeight(profile.height) : 'Not set'}
              </div>
            </div>
          )}

          {/* Weight */}
          {isEditing && isCategoryEnabled('weight') && (
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                Weight
                <label className="ml-3 text-xs font-normal text-gray-500 flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shouldShowCategory('weight')}
                    onChange={() => toggleVisibility('weight')}
                    className="mr-1"
                  />
                  Show on profile
                </label>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={
                    (editedProfile.weight !== undefined || profile?.weight) 
                      ? (units === 'imperial' 
                          ? Math.round(kgToLbs(editedProfile.weight ?? profile?.weight ?? 0)) 
                          : (editedProfile.weight ?? profile?.weight ?? 0))
                      : ''
                  }
                  onChange={(e) => {
                    const value = e.target.value ? parseFloat(e.target.value) : undefined;
                    const kg = value ? (units === 'imperial' ? lbsToKg(value) : value) : undefined;
                    setEditedProfile({ ...editedProfile, weight: kg });
                  }}
                  placeholder={units === 'imperial' ? 'Weight in lbs' : 'Weight in kg'}
                  min={units === 'imperial' ? '50' : '20'}
                  max={units === 'imperial' ? '650' : '300'}
                  step="0.1"
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent bg-white dark:bg-gray-700 text-foreground"
                />
                <span className="text-gray-500 text-sm">{units === 'imperial' ? 'lbs' : 'kg'}</span>
              </div>
            </div>
          )}
          {!isEditing && shouldShowCategory('weight') && (
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 block">Weight</label>
              <div className="text-lg text-foreground">
                {profile.weight ? formatWeight(profile.weight) : 'Not set'}
              </div>
            </div>
          )}

          {/* Dynamic Categories */}
          {isEditing && (
            <>
              {ALL_CATEGORIES.filter(cat => isCategoryEnabled(cat.key) && !['age', 'height', 'weight'].includes(cat.key)).map(category => (
                <div key={category.key}>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                    {category.label}
                    <label className="ml-3 text-xs font-normal text-gray-500 flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={shouldShowCategory(category.key)}
                        onChange={() => toggleVisibility(category.key)}
                        className="mr-1"
                      />
                      Show on profile
                    </label>
                  </label>
                  <input
                    type="text"
                    value={getCategoryValue(category.key)?.toString() || ''}
                    onChange={(e) => setEditedProfile({ ...editedProfile, [category.key]: e.target.value })}
                    placeholder={`Enter your ${category.label.toLowerCase()}`}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent bg-white dark:bg-gray-700 text-foreground"
                  />
                </div>
              ))}
            </>
          )}

          {!isEditing && (
            <>
              {ALL_CATEGORIES.filter(cat => 
                isCategoryEnabled(cat.key) && 
                shouldShowCategory(cat.key) && 
                !['age', 'height', 'weight'].includes(cat.key) &&
                profile[cat.key]
              ).map(category => (
                <div key={category.key}>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 block">{category.label}</label>
                  <div className="text-lg text-foreground">{profile[category.key]}</div>
                </div>
              ))}
            </>
          )}

          {/* Profile Categories Button - Only in edit mode */}
          {isEditing && (
            <div className="pt-2">
              <Button
                onClick={() => setShowCategoriesModal(true)}
                className="w-full bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90"
              >
                <CheckSquare className="w-4 h-4 mr-2 inline" />
                Profile Categories
              </Button>
            </div>
          )}

          {/* Edit/Save Buttons */}
          {isEditing ? (
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSave}
                className="flex-1 bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90"
              >
                Save Changes
              </Button>
              <Button
                onClick={handleCancel}
                className="flex-1 bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90"
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleEdit}
              className="w-full bg-[var(--accent)]/10 text-black hover:bg-[var(--accent)]/20 border border-[var(--accent)]/30 dark:text-white"
            >
              <Edit2 className="w-4 h-4 mr-2 inline text-black dark:text-white" />
              <span className="text-black dark:text-white">Edit Profile</span>
            </Button>
          )}
        </div>

        {/* Settings Button */}
        <Button
          onClick={() => router.push('/settings')}
          className="w-full bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center gap-2 py-4"
        >
          <Settings className="w-5 h-5 text-black dark:text-white" />
          <span className="font-medium text-black dark:text-white">App Settings</span>
        </Button>
      </div>

      {/* Profile Categories Modal */}
      {showCategoriesModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Profile Categories</h3>
              <button
                onClick={() => setShowCategoriesModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Select which categories to include on your profile:
            </p>
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {ALL_CATEGORIES.map((category) => {
                const enabled = isCategoryEnabled(category.key);
                return (
                  <label
                    key={category.key}
                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={() => toggleCategory(category.key)}
                      className="w-4 h-4 text-[var(--accent)] rounded"
                    />
                    <span className="text-foreground font-medium">{category.label}</span>
                  </label>
                );
              })}
            </div>
            
            <button
              onClick={() => setShowCategoriesModal(false)}
              className="mt-4 w-full px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent)]/90"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
