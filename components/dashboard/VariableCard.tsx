'use client';

import { useState } from 'react';
import { Variable, DataPoint } from '@/lib/types';
import { saveDataPoint, getRecentDataPoints } from '@/lib/storage';
import Card from '@/components/ui/Card';
import { Activity, Check, X } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface VariableCardProps {
  variable: Variable;
  onUpdate?: () => void;
}

export default function VariableCard({ variable, onUpdate }: VariableCardProps) {
  const [showInput, setShowInput] = useState(false);
  const [value, setValue] = useState(5);
  const [note, setNote] = useState('');
  
  const recentData = getRecentDataPoints(variable.id, 7);
  const chartData = recentData.map(dp => ({ value: dp.value }));

  const handleSave = () => {
    const dataPoint: DataPoint = {
      id: `dp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      variableId: variable.id,
      value: value,
      date: new Date().toISOString(),
      note: note || undefined,
    };
    
    saveDataPoint(dataPoint);
    setShowInput(false);
    setValue(5);
    setNote('');
    onUpdate?.();
  };

  const handleQuickLog = (quickValue: number) => {
    const dataPoint: DataPoint = {
      id: `dp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      variableId: variable.id,
      value: quickValue,
      date: new Date().toISOString(),
    };
    
    saveDataPoint(dataPoint);
    onUpdate?.();
  };

  return (
    <Card className="relative">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg" style={{ backgroundColor: `${variable.color}20` }}>
            <Activity className="w-5 h-5" style={{ color: variable.color }} />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{variable.name}</h3>
            <p className="text-xs text-gray-500 capitalize">{variable.type}</p>
          </div>
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="h-16 mb-3">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <Line
                type="monotone"
                dataKey="value"
                stroke={variable.color}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {!showInput ? (
        <div className="space-y-2">
          {variable.type === 'binary' && (
            <div className="flex gap-2">
              <button
                onClick={() => handleQuickLog(1)}
                className="flex-1 bg-teal text-white py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Yes
              </button>
              <button
                onClick={() => handleQuickLog(0)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                No
              </button>
            </div>
          )}
          <button
            onClick={() => setShowInput(true)}
            className="w-full bg-white border-2 border-teal text-teal py-2 rounded-lg hover:bg-teal hover:text-white transition-colors"
          >
            Log Entry
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {variable.type === 'scale' && (
            <div>
              <label className="text-sm text-gray-600 mb-1 block">
                Rate 1-10: {value}
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
                className="w-full accent-teal"
              />
            </div>
          )}
          
          {variable.type === 'numeric' && (
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Value</label>
              <input
                type="number"
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal"
              />
            </div>
          )}
          
          <div>
            <label className="text-sm text-gray-600 mb-1 block">
              Note (optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Any observations..."
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal text-sm"
            />
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex-1 bg-teal text-white py-2 rounded-lg hover:opacity-90 transition-opacity"
            >
              Save
            </button>
            <button
              onClick={() => {
                setShowInput(false);
                setValue(5);
                setNote('');
              }}
              className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-500">
          {recentData.length} entries in last 7 days
        </p>
      </div>
    </Card>
  );
}

