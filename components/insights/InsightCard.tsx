import { Insight } from '@/lib/types';
import Card from '@/components/ui/Card';

interface InsightCardProps {
  insight: Insight;
}

export default function InsightCard({ insight }: InsightCardProps) {
  return (
    <Card className="border-l-4 border-[var(--accent)]">
      <p className="text-sm text-foreground leading-relaxed">{insight.text}</p>
      <p className="text-xs text-gray-500 mt-2">
        {new Date(insight.createdAt).toLocaleDateString()}
      </p>
    </Card>
  );
}

