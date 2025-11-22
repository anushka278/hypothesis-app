'use client';

import { Hypothesis } from '@/lib/types';
import { X, CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import Card from '@/components/ui/Card';

interface ConclusionReportProps {
  hypothesis: Hypothesis;
  onKeepTracking: () => void;
  onArchiveAndClose: () => void;
}

export default function ConclusionReport({ hypothesis, onKeepTracking, onArchiveAndClose }: ConclusionReportProps) {
  const verdict = hypothesis.conclusion?.verdict || 'inconclusive';
  const summary = hypothesis.conclusion?.summary || 'No conclusion generated yet.';

  const verdictConfig = {
    supported: {
      label: 'SUPPORTED',
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      badgeColor: 'bg-green-600',
    },
    rejected: {
      label: 'REJECTED',
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      badgeColor: 'bg-red-600',
    },
    inconclusive: {
      label: 'INCONCLUSIVE',
      icon: HelpCircle,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      badgeColor: 'bg-gray-600',
    },
  };

  const config = verdictConfig[verdict];
  const VerdictIcon = config.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Conclusion Report</h2>
          <button
            onClick={onKeepTracking}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Hypothesis Question */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Hypothesis</h3>
            <p className="text-lg font-semibold text-foreground">{hypothesis.question}</p>
          </div>

          {/* Verdict Badge */}
          <div className="flex justify-center">
            <div
              className={`inline-flex items-center gap-3 ${config.bgColor} ${config.borderColor} border-2 rounded-xl px-8 py-6`}
            >
              <VerdictIcon className={`w-12 h-12 ${config.color}`} />
              <span className={`text-2xl font-bold ${config.badgeColor} text-white px-6 py-3 rounded-lg`}>
                {config.label}
              </span>
            </div>
          </div>

          {/* Summary */}
          <Card>
            <h3 className="text-sm font-medium text-gray-500 mb-3">Summary</h3>
            <p className="text-foreground leading-relaxed whitespace-pre-wrap">{summary}</p>
          </Card>

          {/* Experiment Details (if parsed) */}
          {hypothesis.parsed && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Intervention:</span>
                <span className="ml-2 font-medium text-[var(--accent)]">
                  {hypothesis.parsed.intervention}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Outcome:</span>
                <span className="ml-2 font-medium text-coral">
                  {hypothesis.parsed.outcome}
                </span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 pt-4 border-t border-gray-200">
            <button
              onClick={onKeepTracking}
              className="flex-1 py-3 px-6 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Keep Tracking
            </button>
            <button
              onClick={onArchiveAndClose}
              className="flex-1 py-3 px-6 bg-[var(--accent)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Archive & Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

