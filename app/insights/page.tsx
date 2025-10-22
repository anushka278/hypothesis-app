'use client';

import { useState, useEffect } from 'react';
import { Variable } from '@/lib/types';
import { getActiveVariables, getDataPoints, getStreak } from '@/lib/storage';
import { generateInsights } from '@/lib/mock-ai';
import VariableChart from '@/components/insights/VariableChart';
import InsightCard from '@/components/insights/InsightCard';
import Card from '@/components/ui/Card';
import { TrendingUp, Calendar, Activity } from 'lucide-react';

export default function InsightsPage() {
  const [variables, setVariables] = useState<Variable[]>([]);
  const [insights, setInsights] = useState<ReturnType<typeof generateInsights>>([]);
  const [totalEntries, setTotalEntries] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);

  useEffect(() => {
    const vars = getActiveVariables();
    setVariables(vars);
    
    const allDataPoints = getDataPoints();
    setTotalEntries(allDataPoints.length);
    
    const streaks = vars.map(v => getStreak(v.id));
    setLongestStreak(Math.max(...streaks, 0));
    
    setInsights(generateInsights());
  }, []);

  return (
    <div className="min-h-screen">
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <h1 className="text-xl font-bold text-foreground">Insights</h1>
        <p className="text-sm text-gray-500">Discover patterns in your data</p>
      </div>

      <div className="px-4 py-6">
        {variables.length === 0 ? (
          <div className="max-w-md mx-auto text-center py-12">
            <div className="bg-white rounded-xl shadow-sm p-8">
              <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-foreground mb-2">
                No data yet
              </h2>
              <p className="text-gray-500">
                Start tracking variables to see insights and patterns.
              </p>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="text-center">
                <Activity className="w-6 h-6 text-teal mx-auto mb-2" />
                <p className="text-2xl font-bold text-foreground">{variables.length}</p>
                <p className="text-xs text-gray-500">Active Variables</p>
              </Card>
              <Card className="text-center">
                <TrendingUp className="w-6 h-6 text-coral mx-auto mb-2" />
                <p className="text-2xl font-bold text-foreground">{totalEntries}</p>
                <p className="text-xs text-gray-500">Total Entries</p>
              </Card>
              <Card className="text-center">
                <Calendar className="w-6 h-6 text-lavender mx-auto mb-2" />
                <p className="text-2xl font-bold text-foreground">{longestStreak}</p>
                <p className="text-xs text-gray-500">Day Streak</p>
              </Card>
            </div>

            {/* AI Insights */}
            {insights.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-3">
                  AI Insights
                </h2>
                <div className="space-y-3">
                  {insights.map(insight => (
                    <InsightCard key={insight.id} insight={insight} />
                  ))}
                </div>
              </div>
            )}

            {/* Charts */}
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-3">
                Variable Trends
              </h2>
              <div className="space-y-4">
                {variables.map(variable => (
                  <VariableChart key={variable.id} variable={variable} />
                ))}
              </div>
            </div>

            {totalEntries < 5 && (
              <Card className="bg-pastel-blue bg-opacity-20 border border-pastel-blue">
                <p className="text-sm text-foreground">
                  💡 <strong>Tip:</strong> Keep logging data to unlock more powerful insights. 
                  The more data you collect, the better I can identify patterns and correlations.
                </p>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

