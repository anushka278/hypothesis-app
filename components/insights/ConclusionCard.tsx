'use client';

import { Hypothesis } from '@/lib/types';
import Card from '@/components/ui/Card';
import { CheckCircle2, TrendingUp, FileText } from 'lucide-react';

interface ConclusionCardProps {
  hypothesis: Hypothesis;
  onGenerateConclusion: () => void;
  onCompleteExperiment?: () => void; // Debug button
}

export default function ConclusionCard({ hypothesis, onGenerateConclusion, onCompleteExperiment }: ConclusionCardProps) {
  const hasEnoughData = hypothesis.variables.every(v => {
    // Check if variable has sufficient data (mock threshold: 10+ data points)
    const { getDataPoints } = require('@/lib/storage');
    const dataPoints = getDataPoints(v.id);
    return dataPoints.length >= 10;
  });

  return (
    <Card className="bg-gradient-to-br from-pastel-blue/10 to-lavender/10 border-2 border-pastel-blue">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-[var(--accent)]/20 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-[var(--accent)]" />
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Ready for Conclusion
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Your experiment "{hypothesis.question}" has collected sufficient data to generate a conclusion.
          </p>
          
          {!hasEnoughData && onCompleteExperiment && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-800 mb-2">
                <strong>Debug:</strong> For testing, click below to mark experiment as ready.
              </p>
              <button
                onClick={onCompleteExperiment}
                className="text-xs bg-yellow-100 text-yellow-800 px-3 py-1 rounded hover:bg-yellow-200 transition-colors"
              >
                Mark as Ready (Debug)
              </button>
            </div>
          )}

          <button
            onClick={onGenerateConclusion}
            className="inline-flex items-center gap-2 bg-[var(--accent)] text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity shadow-sm"
          >
            <FileText className="w-5 h-5" />
            Generate Conclusion
          </button>
        </div>
      </div>
    </Card>
  );
}

