'use client';

import { motion } from 'framer-motion';
import { KnowledgeCard as KnowledgeCardType } from '@/lib/types';
import { BookOpen, Lightbulb, Clock, Pill, ListChecks } from 'lucide-react';

interface KnowledgeCardProps {
  knowledgeCard: KnowledgeCardType;
}

export default function KnowledgeCard({ knowledgeCard }: KnowledgeCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-gradient-to-br from-[var(--accent)]/10 to-sage-green/10 rounded-xl p-5 border-2 border-[var(--accent)]/30 shadow-sm my-4"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-[var(--accent)] rounded-lg">
          <BookOpen className="w-5 h-5 text-white" />
        </div>
        <h3 className="font-semibold text-foreground text-lg">
          Knowledge Card: {knowledgeCard.intervention}
        </h3>
      </div>

      {/* Background Info */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Lightbulb className="w-4 h-4 text-coral" />
          <h4 className="font-medium text-sm text-foreground">Background</h4>
        </div>
        <ul className="space-y-1 ml-6">
          {knowledgeCard.backgroundInfo.map((info, idx) => (
            <li key={idx} className="text-sm text-gray-700 list-disc">
              {info}
            </li>
          ))}
        </ul>
      </div>

      {/* Evidence Summary */}
      <div className="mb-4 bg-white/50 rounded-lg p-3">
        <p className="text-sm text-gray-800 italic">
          📊 {knowledgeCard.evidenceSummary}
        </p>
      </div>

      {/* Dosage/Amount */}
      {knowledgeCard.typicalDosage && (
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-1">
            <Pill className="w-4 h-4 text-lavender" />
            <h4 className="font-medium text-sm text-foreground">Typical Amount</h4>
          </div>
          <p className="text-sm text-gray-700 ml-6">{knowledgeCard.typicalDosage}</p>
        </div>
      )}

      {/* Timing */}
      {knowledgeCard.timing && (
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-pastel-blue" />
            <h4 className="font-medium text-sm text-foreground">Timing</h4>
          </div>
          <p className="text-sm text-gray-700 ml-6">{knowledgeCard.timing}</p>
        </div>
      )}

      {/* Related Control Variables */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-2">
          <ListChecks className="w-4 h-4 text-sage-green" />
          <h4 className="font-medium text-sm text-foreground">
            Recommended Control Variables
          </h4>
        </div>
        <div className="flex flex-wrap gap-2 ml-6">
          {knowledgeCard.relatedControls.map((control, idx) => (
            <span
              key={idx}
              className="px-2 py-1 bg-white rounded-full text-xs font-medium text-gray-700 border border-gray-200"
            >
              {control}
            </span>
          ))}
        </div>
      </div>

      {/* Sources */}
      {knowledgeCard.sources && knowledgeCard.sources.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            📚 References: {knowledgeCard.sources.join(' • ')}
          </p>
        </div>
      )}
    </motion.div>
  );
}

