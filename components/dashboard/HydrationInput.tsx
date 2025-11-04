'use client';

import { useState } from 'react';
import { Droplet, Plus, Minus } from 'lucide-react';

interface HydrationInputProps {
  onLog: (amount: number, unit: 'glass' | 'oz' | 'mug' | 'bottle') => void;
  todayTotal?: number; // Total oz for today
}

const hydrationOptions = [
  { label: 'Glass (8oz)', amount: 8, unit: 'glass' as const },
  { label: '16 oz', amount: 16, unit: 'oz' as const },
  { label: '32 oz', amount: 32, unit: 'oz' as const },
];

export default function HydrationInput({ onLog, todayTotal = 0 }: HydrationInputProps) {
  const [customAmount, setCustomAmount] = useState<number>(8);

  const handleQuickLog = (amount: number, unit: 'glass' | 'oz' | 'mug' | 'bottle') => {
    onLog(amount, unit);
  };

  const handleCustomLog = () => {
    onLog(customAmount, 'oz');
    setCustomAmount(8);
  };

  return (
    <div className="space-y-4">
      {todayTotal > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
              Today's Total:
            </span>
            <span className="text-lg font-bold text-blue-700 dark:text-blue-300">
              {todayTotal} oz
            </span>
          </div>
        </div>
      )}

      <div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          Quick add:
        </p>
        <div className="grid grid-cols-3 gap-2">
          {hydrationOptions.map((option) => (
            <button
              key={option.label}
              onClick={() => handleQuickLog(option.amount, option.unit)}
              className="flex items-center justify-center gap-2 p-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-[var(--accent)] hover:bg-[var(--accent)]/5 transition-colors"
            >
              <Droplet className="w-4 h-4 text-[var(--accent)]" />
              <span className="text-sm text-foreground">{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1.5">
          Custom amount (oz):
        </p>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCustomAmount(Math.max(1, customAmount - 1))}
            className="p-1.5 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex-shrink-0"
          >
            <Minus className="w-3 h-3 text-gray-500" />
          </button>
          <input
            type="number"
            min="1"
            value={customAmount}
            onChange={(e) => setCustomAmount(Math.max(1, Number(e.target.value)))}
            className="flex-1 min-w-0 border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-center"
          />
          <button
            onClick={() => setCustomAmount(customAmount + 1)}
            className="p-1.5 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex-shrink-0"
          >
            <Plus className="w-3 h-3 text-gray-500" />
          </button>
          <button
            onClick={handleCustomLog}
            className="px-3 py-1.5 text-sm bg-[var(--accent)] text-white rounded-lg hover:opacity-90 transition-opacity flex-shrink-0"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

