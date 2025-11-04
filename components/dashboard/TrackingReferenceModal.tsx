'use client';

import { Variable } from '@/lib/types';
import { X } from 'lucide-react';

interface TrackingReferenceModalProps {
  variable: Variable;
  onClose: () => void;
}

export default function TrackingReferenceModal({ variable, onClose }: TrackingReferenceModalProps) {
  const getReferenceContent = () => {
    const varName = variable.name.toLowerCase();
    
    // Scale variables
    if (variable.type === 'scale') {
      if (varName.includes('sleep') || varName.includes('quality')) {
        return {
          title: 'Sleep Quality Scale',
          description: 'Rate your sleep quality on a scale of 1-10:',
          guidelines: [
            '1-3: Very poor sleep - multiple awakenings, restless, unrested',
            '4-5: Poor sleep - some disturbances, not fully rested',
            '6-7: Fair sleep - some interruptions, moderately rested',
            '8-9: Good sleep - few disturbances, well rested',
            '10: Excellent sleep - uninterrupted, completely rested'
          ]
        };
      } else if (varName.includes('stress') || varName.includes('anxiety')) {
        return {
          title: 'Stress Level Scale',
          description: 'Rate your stress level on a scale of 1-10:',
          guidelines: [
            '1-2: Very low stress - completely relaxed',
            '3-4: Low stress - mildly noticeable',
            '5-6: Moderate stress - noticeable but manageable',
            '7-8: High stress - significantly impacting daily life',
            '9-10: Very high stress - overwhelming, difficult to function'
          ]
        };
      } else if (varName.includes('energy')) {
        return {
          title: 'Energy Level Scale',
          description: 'Rate your energy level on a scale of 1-10:',
          guidelines: [
            '1-2: Very low - exhausted, need rest',
            '3-4: Low - feeling tired, low motivation',
            '5-6: Moderate - average energy, functioning normally',
            '7-8: High - energetic, productive',
            '9-10: Very high - peak energy, highly active'
          ]
        };
      } else if (varName.includes('mood') || varName.includes('happiness')) {
        return {
          title: 'Mood Scale',
          description: 'Rate your mood on a scale of 1-10:',
          guidelines: [
            '1-2: Very low - depressed, very unhappy',
            '3-4: Low - sad, down',
            '5-6: Neutral - neither happy nor sad',
            '7-8: Good - positive, content',
            '9-10: Excellent - very happy, joyful'
          ]
        };
      } else if (varName.includes('focus') || varName.includes('concentration')) {
        return {
          title: 'Focus/Concentration Scale',
          description: 'Rate your focus level on a scale of 1-10:',
          guidelines: [
            '1-2: Very poor - unable to concentrate',
            '3-4: Poor - easily distracted',
            '5-6: Moderate - some focus, occasional distractions',
            '7-8: Good - strong focus, minimal distractions',
            '9-10: Excellent - laser focus, completely engaged'
          ]
        };
      } else {
        return {
          title: `${variable.name} Scale`,
          description: 'Rate on a scale of 1-10:',
          guidelines: [
            '1-2: Very low',
            '3-4: Low',
            '5-6: Moderate',
            '7-8: High',
            '9-10: Very high'
          ]
        };
      }
    }
    
    // Binary variables
    if (variable.type === 'binary') {
      if (varName.includes('exercise') || varName.includes('workout')) {
        return {
          title: 'Exercise Tracking',
          description: 'Track whether you exercised:',
          guidelines: [
            'Yes (1): You completed any form of exercise or physical activity',
            'No (0): You did not exercise',
            '💡 Tip: Use the enhanced exercise input to log detailed information like exercise type, duration, and distance'
          ]
        };
      } else if (varName.includes('hydration') || varName.includes('water')) {
        return {
          title: 'Hydration Tracking',
          description: 'Track your daily hydration:',
          guidelines: [
            'Each entry adds to your daily total',
            'Options: Glass of water (8 oz), 8/16/32 oz, mug, or bottle',
            '💡 Tip: Log multiple entries throughout the day to track cumulative hydration'
          ]
        };
      } else if (varName.includes('meditation') || varName.includes('mindfulness')) {
        return {
          title: 'Meditation/Mindfulness Tracking',
          description: 'Track your meditation practice:',
          guidelines: [
            'Yes (1): You completed a meditation or mindfulness session',
            'No (0): You did not meditate',
            '💡 Tip: Add a note about session length or type in the optional note field'
          ]
        };
      } else {
        return {
          title: `${variable.name} Binary`,
          description: 'Track this variable:',
          guidelines: [
            'Yes (1): The event/activity occurred',
            'No (0): The event/activity did not occur'
          ]
        };
      }
    }
    
    // Numeric variables
    if (variable.type === 'numeric') {
      if (varName.includes('caffeine') || varName.includes('coffee')) {
        return {
          title: 'Caffeine Intake',
          description: 'Track your caffeine consumption:',
          guidelines: [
            'Enter the number of servings (cups, shots, etc.)',
            'Example: 2 cups of coffee = 2',
            '💡 Tip: Be consistent with your serving size'
          ]
        };
      } else if (varName.includes('sleep') && varName.includes('duration') || varName.includes('hours')) {
        return {
          title: 'Sleep Duration',
          description: 'Track hours of sleep:',
          guidelines: [
            'Enter the number of hours you slept',
            'Example: 7.5 hours = 7.5',
            '💡 Tip: Track from when you fell asleep to when you woke up'
          ]
        };
      } else {
        return {
          title: `${variable.name} Numeric`,
          description: 'Enter a numeric value:',
          guidelines: [
            'Enter the numeric measurement for this variable',
            'Use consistent units (e.g., hours, cups, servings)'
          ]
        };
      }
    }
    
    return {
      title: `${variable.name} Reference`,
      description: `This is a ${variable.type} variable.`,
      guidelines: ['Use the input fields to track this variable consistently.']
    };
  };

  const content = getReferenceContent();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">{content.title}</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">{content.description}</p>
          
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
              Guidelines:
            </p>
            <ul className="space-y-2">
              {content.guidelines.map((guideline, index) => (
                <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                  <span className="text-[var(--accent)] mt-1">•</span>
                  <span>{guideline}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              <strong>Variable Type:</strong> {variable.type.charAt(0).toUpperCase() + variable.type.slice(1)}
            </p>
          </div>
        </div>
        
        <button
          onClick={onClose}
          className="mt-6 w-full px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:opacity-90 transition-opacity"
        >
          Got it
        </button>
      </div>
    </div>
  );
}

