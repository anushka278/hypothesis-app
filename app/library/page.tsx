'use client';

import { useState, useEffect } from 'react';
import { Hypothesis } from '@/lib/types';
import { getHypotheses, archiveHypothesis } from '@/lib/storage';
import Card from '@/components/ui/Card';
import { BookOpen, Archive, CheckCircle, MessageSquare } from 'lucide-react';
import AppHeader from '@/components/ui/AppHeader';
import { useRouter } from 'next/navigation';

export default function LibraryPage() {
  const [hypotheses, setHypotheses] = useState<Hypothesis[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setHypotheses(getHypotheses());
  }, []);

  const handleArchive = (id: string) => {
    archiveHypothesis(id);
    setHypotheses(getHypotheses());
  };

  const handleOpenConversation = (hypothesis: Hypothesis) => {
    if (hypothesis.conversationId) {
      router.push(`/chat?conversationId=${hypothesis.conversationId}`);
    }
  };

  const activeHypotheses = hypotheses.filter(h => !h.archived);
  const archivedHypotheses = hypotheses.filter(h => h.archived);
  const displayHypotheses = showArchived ? archivedHypotheses : activeHypotheses;

  return (
    <div className="min-h-screen">
      <AppHeader />

      <div className="px-4 py-6">
        <div className="max-w-2xl mx-auto">
          {/* Toggle */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setShowArchived(false)}
              className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                !showArchived
                  ? 'bg-[var(--accent)] text-white'
                  : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              Active ({activeHypotheses.length})
            </button>
            <button
              onClick={() => setShowArchived(true)}
              className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                showArchived
                  ? 'bg-[var(--accent)] text-white'
                  : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              Archived ({archivedHypotheses.length})
            </button>
          </div>

          {/* List */}
          {displayHypotheses.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-white rounded-xl shadow-sm p-8">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h2 className="text-lg font-semibold text-foreground mb-2">
                  {showArchived ? 'No archived hypotheses' : 'No active hypotheses'}
                </h2>
                <p className="text-gray-500">
                  {showArchived
                    ? 'Archived hypotheses will appear here.'
                    : 'Create your first hypothesis in the Chat tab.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {displayHypotheses.map(hypothesis => (
                <Card key={hypothesis.id}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-2">
                        {hypothesis.question}
                      </h3>
                      
                      {/* Parsed Information */}
                      {hypothesis.parsed && (
                        <div className="mb-3 p-2 bg-[var(--accent)]/5 rounded-lg border border-[var(--accent)]/20">
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-gray-500">Intervention:</span>
                              <span className="ml-1 font-medium text-[var(--accent)]">
                                {hypothesis.parsed.intervention}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Outcome:</span>
                              <span className="ml-1 font-medium text-coral">
                                {hypothesis.parsed.outcome}
                              </span>
                            </div>
                          </div>
                          <div className="mt-1 text-xs">
                            <span className="text-gray-500">Category:</span>
                            <span className="ml-1 px-2 py-0.5 bg-lavender/30 text-lavender rounded-full text-xs font-medium capitalize">
                              {hypothesis.parsed.category}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {/* Variables */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {hypothesis.variables.filter(v => !v.isControl).map(variable => (
                          <span
                            key={variable.id}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: `${variable.color}20`,
                              color: variable.color,
                            }}
                          >
                            {variable.name}
                          </span>
                        ))}
                        {hypothesis.variables.filter(v => v.isControl).length > 0 && (
                          <span className="text-xs text-gray-500">
                            +{hypothesis.variables.filter(v => v.isControl).length} controls
                          </span>
                        )}
                      </div>
                      
                      {/* Baseline Phase Info */}
                      {hypothesis.baselinePhase && (
                        <div className="mb-2 text-xs text-gray-600 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          <span>
                            {hypothesis.baselinePhase.completed ? 
                              'Baseline completed' : 
                              'Baseline phase in progress'}
                          </span>
                        </div>
                      )}
                      
                      <p className="text-xs text-gray-500">
                        Created {new Date(hypothesis.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="ml-4 flex items-center gap-2">
                      {hypothesis.conversationId && (
                        <button
                          onClick={() => handleOpenConversation(hypothesis)}
                          className="p-2 text-gray-400 hover:text-[var(--accent)] transition-colors"
                          title="Open conversation"
                        >
                          <MessageSquare className="w-5 h-5" />
                        </button>
                      )}
                      {!hypothesis.archived && (
                        <button
                          onClick={() => handleArchive(hypothesis.id)}
                          className="p-2 text-gray-400 hover:text-coral transition-colors"
                          title="Archive hypothesis"
                        >
                          <Archive className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                  {hypothesis.archived && (
                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2 text-gray-500">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-xs">Archived</span>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

