'use client';

import { useState, useEffect } from 'react';
import { Variable, Hypothesis } from '@/lib/types';
import { getActiveVariables, getActiveHypotheses } from '@/lib/storage';
import VariableCard from '@/components/dashboard/VariableCard';
import { PlusCircle, Calendar, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [variables, setVariables] = useState<Variable[]>([]);
  const [hypotheses, setHypotheses] = useState<Hypothesis[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setVariables(getActiveVariables());
    setHypotheses(getActiveHypotheses());
  }, [refreshKey]);

  const handleUpdate = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Check if we're in baseline phase
  const baselineHypothesis = hypotheses.find(h => 
    h.baselinePhase && !h.baselinePhase.completed && 
    new Date(h.baselinePhase.endDate) > new Date()
  );

  const daysUntilIntervention = baselineHypothesis ? 
    Math.ceil((new Date(baselineHypothesis.baselinePhase!.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <div className="min-h-screen">
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <h1 className="text-xl font-bold text-foreground">Track Variables</h1>
        <p className="text-sm text-gray-500">Log your daily data</p>
      </div>

      <div className="px-4 py-6">
        {/* Baseline Phase Banner */}
        {baselineHypothesis && (
          <div className="max-w-2xl mx-auto mb-6">
            <div className="bg-gradient-to-r from-pastel-blue/20 to-lavender/20 border-2 border-pastel-blue rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-6 h-6 text-pastel-blue mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">
                    📊 Baseline Phase Active
                  </h3>
                  <p className="text-sm text-gray-700 mb-2">
                    Track your outcome for <strong>{daysUntilIntervention} more days</strong> before starting{' '}
                    <strong>{baselineHypothesis.parsed?.intervention}</strong>.
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <AlertCircle className="w-4 h-4" />
                    <span>This creates a comparison baseline for your experiment</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {variables.length === 0 ? (
          <div className="max-w-md mx-auto text-center py-12">
            <div className="bg-white rounded-xl shadow-sm p-8">
              <PlusCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-foreground mb-2">
                No variables yet
              </h2>
              <p className="text-gray-500 mb-6">
                Start a hypothesis in the Chat tab to begin tracking.
              </p>
              <Link
                href="/chat"
                className="inline-block bg-teal text-white px-6 py-2 rounded-lg hover:opacity-90 transition-opacity"
              >
                Create Hypothesis
              </Link>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Primary Variables */}
            <div>
              <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
                Primary Variables
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {variables.filter(v => !v.isControl).map(variable => (
                  <VariableCard
                    key={variable.id}
                    variable={variable}
                    onUpdate={handleUpdate}
                  />
                ))}
              </div>
            </div>

            {/* Control Variables */}
            {variables.some(v => v.isControl) && (
              <div>
                <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
                  Control Variables
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {variables.filter(v => v.isControl).map(variable => (
                    <VariableCard
                      key={variable.id}
                      variable={variable}
                      onUpdate={handleUpdate}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

