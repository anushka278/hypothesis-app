'use client';

import { useState } from 'react';
import { 
  Coffee, 
  Utensils, 
  Cookie,
  Clock,
  Flame,
  FileText,
  X,
  ChefHat
} from 'lucide-react';

interface NutritionInputProps {
  value: number;
  onChange: (value: number, metadata?: any) => void;
  onCancel?: () => void;
}

const mealTypes = [
  { id: 'breakfast', name: 'Breakfast', icon: Coffee },
  { id: 'lunch', name: 'Lunch', icon: Utensils },
  { id: 'dinner', name: 'Dinner', icon: ChefHat },
  { id: 'snack', name: 'Snack', icon: Cookie },
];

export default function NutritionInput({ value, onChange, onCancel }: NutritionInputProps) {
  const [selectedMeal, setSelectedMeal] = useState<string | null>(null);
  const [timeOfDay, setTimeOfDay] = useState('');
  const [calories, setCalories] = useState<number>(0);
  const [ingredients, setIngredients] = useState('');

  const selectedMealType = mealTypes.find(m => m.id === selectedMeal);

  const handleSave = () => {
    const metadata: any = {
      mealType: selectedMealType?.name || 'Other',
      timeOfDay: timeOfDay || undefined,
      calories: calories || undefined,
      ingredients: ingredients || undefined,
    };

    onChange(1, metadata);
  };

  if (selectedMeal) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {selectedMealType && (
              <>
                <selectedMealType.icon className="w-5 h-5 text-[var(--accent)]" />
                <span className="font-medium text-foreground">{selectedMealType.name}</span>
              </>
            )}
          </div>
          <button
            onClick={() => {
              setSelectedMeal(null);
              setTimeOfDay('');
              setCalories(0);
              setIngredients('');
            }}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div>
          <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Time of day (optional)
          </label>
          <input
            type="text"
            value={timeOfDay}
            onChange={(e) => setTimeOfDay(e.target.value)}
            placeholder="e.g., 8:00 AM"
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
        </div>

        <div>
          <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block flex items-center gap-2">
            <Flame className="w-4 h-4" />
            Estimated calories (optional)
          </label>
          <input
            type="number"
            min="0"
            value={calories || ''}
            onChange={(e) => setCalories(Number(e.target.value))}
            placeholder="e.g., 500"
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
        </div>

        <div>
          <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Brief ingredients (optional)
          </label>
          <input
            type="text"
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            placeholder="e.g., chicken, rice, vegetables"
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-sm"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="flex-1 bg-[var(--accent)] text-white py-2 rounded-lg hover:opacity-90 transition-opacity"
          >
            Log Meal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
        Select meal type:
      </p>
      <div className="grid grid-cols-2 gap-2">
        {mealTypes.map((meal) => {
          const Icon = meal.icon;
          return (
            <button
              key={meal.id}
              onClick={() => setSelectedMeal(meal.id)}
              className="flex flex-col items-center justify-center gap-2 p-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-[var(--accent)] hover:bg-[var(--accent)]/5 transition-colors"
            >
              <Icon className="w-6 h-6 text-[var(--accent)]" />
              <span className="text-xs text-center text-foreground">{meal.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

