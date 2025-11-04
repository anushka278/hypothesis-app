'use client';

import { useState } from 'react';
import { 
  Dumbbell, 
  Bike, 
  Waves, 
  Activity, 
  SkipForward,
  X,
  Clock,
  MapPin,
  Zap
} from 'lucide-react';

interface ExerciseInputProps {
  value: number;
  onChange: (value: number, metadata?: any) => void;
  onSkip?: () => void;
  onCancel?: () => void;
  onNoteChange?: (note: string) => void;
}

const exerciseTypes = [
  { id: 'running', name: 'Running', icon: Zap, fields: ['distance', 'duration'] },
  { id: 'walking', name: 'Walking', icon: Activity, fields: ['distance', 'duration'] },
  { id: 'cycling', name: 'Cycling', icon: Bike, fields: ['distance', 'duration'] },
  { id: 'swimming', name: 'Swimming', icon: Waves, fields: ['duration', 'laps'] },
  { id: 'strength', name: 'Strength Training', icon: Dumbbell, fields: ['duration'] },
  { id: 'other', name: 'Other', icon: Activity, fields: ['duration'] },
];

export default function ExerciseInput({ value, onChange, onSkip, onCancel, onNoteChange }: ExerciseInputProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [distance, setDistance] = useState<number>(0);
  const [laps, setLaps] = useState<number>(0);
  const [note, setNote] = useState<string>('');

  const selectedExercise = exerciseTypes.find(e => e.id === selectedType);

  const handleSave = () => {
    const metadata: any = {
      exerciseType: selectedExercise?.name || 'Other',
      duration: duration || undefined,
      note: note || undefined,
    };

    if (selectedExercise?.fields.includes('distance')) {
      metadata.distance = distance || undefined;
    }
    if (selectedExercise?.fields.includes('laps')) {
      metadata.laps = laps || undefined;
    }

    onChange(1, metadata);
  };

  const handleQuickLog = () => {
    onChange(1);
  };

  if (selectedType) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {selectedExercise && (
              <>
                <selectedExercise.icon className="w-5 h-5 text-[var(--accent)]" />
                <span className="font-medium text-foreground">{selectedExercise.name}</span>
              </>
            )}
          </div>
          <button
            onClick={() => {
              setSelectedType(null);
              setDuration(0);
              setDistance(0);
              setLaps(0);
            }}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {selectedExercise?.fields.includes('duration') && (
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Duration (minutes)
            </label>
            <input
              type="number"
              min="0"
              value={duration || ''}
              onChange={(e) => setDuration(Number(e.target.value))}
              placeholder="e.g., 30 (optional)"
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
          </div>
        )}

        {selectedExercise?.fields.includes('distance') && (
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Distance (miles)
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={distance || ''}
              onChange={(e) => setDistance(Number(e.target.value))}
              placeholder="e.g., 3.5 (optional)"
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
          </div>
        )}

        {selectedExercise?.fields.includes('laps') && (
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">
              Laps
            </label>
            <input
              type="number"
              min="0"
              value={laps || ''}
              onChange={(e) => setLaps(Number(e.target.value))}
              placeholder="e.g., 20 (optional)"
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
          </div>
        )}

        <div>
          <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">
            Any observations (optional)
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
              onNoteChange?.(e.target.value);
            }}
            placeholder="Any observations..."
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-sm"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="flex-1 bg-[var(--accent)] text-white py-2 rounded-lg hover:opacity-90 transition-opacity"
          >
            Log Exercise
          </button>
          {onCancel && (
            <button
              onClick={onCancel}
              className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
        Select exercise type:
      </p>
      <div className="grid grid-cols-3 gap-2">
        {exerciseTypes.map((exercise) => {
          const Icon = exercise.icon;
          return (
            <button
              key={exercise.id}
              onClick={() => setSelectedType(exercise.id)}
              className="flex flex-col items-center justify-center gap-2 p-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-[var(--accent)] hover:bg-[var(--accent)]/5 transition-colors"
            >
              <Icon className="w-6 h-6 text-[var(--accent)]" />
              <span className="text-xs text-center text-foreground">{exercise.name}</span>
            </button>
          );
        })}
      </div>
      <button
        onClick={handleQuickLog}
        className="w-full text-sm text-gray-600 dark:text-gray-400 hover:text-[var(--accent)] py-2 flex items-center justify-center gap-2"
      >
        <SkipForward className="w-4 h-4" />
        Just log "Yes" without details
      </button>
    </div>
  );
}

