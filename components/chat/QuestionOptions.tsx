'use client';

import { motion } from 'framer-motion';

interface QuestionOptionsProps {
  options: string[];
  onSelect: (option: string) => void;
  disabled?: boolean;
}

export default function QuestionOptions({ options, onSelect, disabled = false }: QuestionOptionsProps) {
  return (
    <div className="mt-3 space-y-2">
      {options.map((option, idx) => (
        <motion.button
          key={idx}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.1, duration: 0.2 }}
          onClick={() => !disabled && onSelect(option)}
          disabled={disabled}
          className="w-full text-left px-4 py-3 bg-white dark:bg-gray-800 border-2 border-[var(--accent)]/30 rounded-xl hover:border-[var(--accent)] hover:bg-[var(--accent)]/5 transition-all text-sm text-foreground disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          <span className="text-[var(--accent)] font-medium">•</span> {option}
        </motion.button>
      ))}
    </div>
  );
}

