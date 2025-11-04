'use client';

import { ParsedHypothesis, KnowledgeCard } from '@/lib/types';
import { CheckCircle, Clock, Target, FlaskConical, BarChart3, X } from 'lucide-react';

interface ExperimentSummaryProps {
  hypothesisText: string;
  parsed: ParsedHypothesis;
  knowledgeCard?: KnowledgeCard;
  frequency?: string;
  timing?: string;
  outcomeContext?: string;
  wantsBaseline: boolean;
  baselineDays: number;
  selectedControls: string[];
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ExperimentSummary({
  hypothesisText,
  parsed,
  knowledgeCard,
  frequency,
  timing,
  outcomeContext,
  wantsBaseline,
  baselineDays,
  selectedControls,
  onConfirm,
  onCancel,
}: ExperimentSummaryProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-[var(--accent)] shadow-xl p-6 my-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <FlaskConical className="w-6 h-6 text-[var(--accent)]" />
          Experiment Summary
        </h3>
        <button
          onClick={onCancel}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="space-y-4">
        {/* Hypothesis */}
        <div className="bg-gradient-to-r from-[var(--accent)]/10 to-[var(--accent)]/5 rounded-xl p-4 border border-[var(--accent)]/20">
          <div className="flex items-start gap-3">
            <Target className="w-5 h-5 text-[var(--accent)] mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Hypothesis</h4>
              <p className="text-gray-700 dark:text-gray-300 text-sm">{hypothesisText}</p>
            </div>
          </div>
        </div>

        {/* Intervention & Outcome */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <FlaskConical className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1 text-sm">Intervention</h4>
                <p className="text-gray-700 dark:text-gray-300 text-sm font-medium capitalize">{parsed.intervention}</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
            <div className="flex items-start gap-3">
              <BarChart3 className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1 text-sm">Outcome</h4>
                <p className="text-gray-700 dark:text-gray-300 text-sm font-medium capitalize">{parsed.outcome}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {frequency && (
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1 text-sm">Frequency</h4>
                  <p className="text-gray-700 dark:text-gray-300 text-sm">{frequency}</p>
                </div>
              </div>
            </div>
          )}

          {timing && (
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1 text-sm">Timing</h4>
                  <p className="text-gray-700 dark:text-gray-300 text-sm">{timing}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Context */}
        {outcomeContext && (
          <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 border border-indigo-200 dark:border-indigo-800">
            <div className="flex items-start gap-3">
              <Target className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1 text-sm">Context</h4>
                <p className="text-gray-700 dark:text-gray-300 text-sm">{outcomeContext}</p>
              </div>
            </div>
          </div>
        )}

        {/* Baseline - Always Recommended */}
        <div className="rounded-xl p-4 border bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-1 text-sm">Baseline Period (Recommended)</h4>
              <p className="text-gray-700 dark:text-gray-300 text-sm">
                ✓ {baselineDays} days of baseline tracking before starting intervention. This helps establish a comparison point for more reliable results.
              </p>
            </div>
          </div>
        </div>

        {/* Control Variables */}
        {selectedControls.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-3">
              <BarChart3 className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">Control Variables</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedControls.map((control, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white dark:bg-gray-800 border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300"
                    >
                      {control}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-3 rounded-xl font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 px-4 py-3 rounded-xl font-medium text-white bg-[var(--accent)] hover:opacity-90 transition-opacity shadow-lg"
        >
          Create Experiment
        </button>
      </div>
    </div>
  );
}

