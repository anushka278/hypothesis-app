'use client';

import { useState } from 'react';
import { Moon, Clock } from 'lucide-react';

interface SleepInputProps {
  value: number;
  onChange: (quality: number, duration: number, note?: string) => void;
  onCancel?: () => void;
}

export default function SleepInput({ value, onChange, onCancel }: SleepInputProps) {
  const [quality, setQuality] = useState(5);
  const [duration, setDuration] = useState(7);
  const [note, setNote] = useState('');

  const handleSave = () => {
    onChange(quality, duration, note || undefined);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block flex items-center gap-2">
          <Moon className="w-4 h-4" />
          Sleep Quality (1-10): {quality}
        </label>
        <input
          type="range"
          min="1"
          max="10"
          value={quality}
          onChange={(e) => setQuality(Number(e.target.value))}
          className="w-full accent-teal"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>1 - Poor</span>
          <span>10 - Excellent</span>
        </div>
      </div>

      <div>
        <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Sleep Duration (hours): {duration}
        </label>
        <input
          type="range"
          min="1"
          max="12"
          step="0.5"
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          className="w-full accent-teal"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>1 hour</span>
          <span>12 hours</span>
        </div>
      </div>

      <div>
        <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">
          Any observations (optional)
        </label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Any observations..."
          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-sm"
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          className="flex-1 bg-[var(--accent)] text-white py-2 rounded-lg hover:opacity-90 transition-opacity"
        >
          Log Sleep
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

