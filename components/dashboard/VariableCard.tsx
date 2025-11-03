'use client';

import { useState } from 'react';
import { Variable, DataPoint, DataSource } from '@/lib/types';
import { saveDataPoint, getRecentDataPoints, getDataSources, saveVariable } from '@/lib/storage';
import Card from '@/components/ui/Card';
import { Activity, Check, X, MoreVertical, Link as LinkIcon, Unlink } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface VariableCardProps {
  variable: Variable;
  onUpdate?: () => void;
}

export default function VariableCard({ variable, onUpdate }: VariableCardProps) {
  const [showInput, setShowInput] = useState(false);
  const [value, setValue] = useState(5);
  const [note, setNote] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  
  const recentData = getRecentDataPoints(variable.id, 7);
  const chartData = recentData.map(dp => ({ value: dp.value }));
  const dataSources = getDataSources();
  const linkedSource = variable.dataSourceId ? dataSources.find(s => s.id === variable.dataSourceId) : null;

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

  const handleLinkSource = (sourceId: string) => {
    const updated = { ...variable, dataSourceId: sourceId };
    saveVariable(updated);
    setShowLinkModal(false);
    setShowMenu(false);
    onUpdate?.();
  };

  const handleUnlink = () => {
    const updated = { ...variable };
    delete updated.dataSourceId;
    saveVariable(updated);
    setShowMenu(false);
    onUpdate?.();
  };

  return (
    <Card className="relative">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-1">
          <div className="p-2 rounded-lg" style={{ backgroundColor: `${variable.color}20` }}>
            <Activity className="w-5 h-5" style={{ color: variable.color }} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground">{variable.name}</h3>
              {linkedSource && (
                <LinkIcon className="w-4 h-4 text-[var(--accent)]" title={`Linked to ${linkedSource.name}`} />
              )}
            </div>
            <p className="text-xs text-gray-500 capitalize">{variable.type}</p>
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <MoreVertical className="w-5 h-5 text-gray-500" />
          </button>
          
          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 py-1">
                {linkedSource ? (
                  <button
                    onClick={handleUnlink}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Unlink className="w-4 h-4" />
                    Unlink from {linkedSource.name}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setShowLinkModal(true);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <LinkIcon className="w-4 h-4" />
                    Link to Data Source
                  </button>
                )}
              </div>
            </>
          )}
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
                className="flex-1 bg-[var(--accent)] text-white py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
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
            className="w-full bg-white border-2 border-[var(--accent)] text-[var(--accent)] py-2 rounded-lg hover:bg-[var(--accent)] hover:text-white transition-colors"
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
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
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
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-sm"
            />
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex-1 bg-[var(--accent)] text-white py-2 rounded-lg hover:opacity-90 transition-opacity"
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

      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
        <p className="text-xs text-gray-500">
          {recentData.length} entries in last 7 days
        </p>
      </div>

      {/* Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-foreground mb-4">Link to Data Source</h3>
            {dataSources.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500 mb-4">No apps or devices connected yet.</p>
                <p className="text-xs text-gray-400">Go to Settings → Connect My Data to add sources.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {dataSources.map((source) => (
                  <button
                    key={source.id}
                    onClick={() => handleLinkSource(source.id)}
                    className="w-full text-left p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div className="font-medium text-foreground">{source.name}</div>
                    <div className="text-xs text-gray-500 capitalize">
                      {source.type === 'app' ? 'App' : 'Device'} • {source.status}
                    </div>
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={() => setShowLinkModal(false)}
              className="mt-4 w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}

