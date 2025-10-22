'use client';

import { Variable, DataPoint } from '@/lib/types';
import { getDataPoints } from '@/lib/storage';
import Card from '@/components/ui/Card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface VariableChartProps {
  variable: Variable;
}

export default function VariableChart({ variable }: VariableChartProps) {
  const dataPoints = getDataPoints(variable.id);
  
  const chartData = dataPoints
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(dp => ({
      date: new Date(dp.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: dp.value,
      fullDate: dp.date,
    }));

  if (chartData.length === 0) {
    return null;
  }

  return (
    <Card>
      <h3 className="font-semibold text-foreground mb-4">{variable.name}</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
            stroke="#999"
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            stroke="#999"
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'white', 
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              fontSize: '12px'
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={variable.color}
            strokeWidth={3}
            dot={{ fill: variable.color, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}

