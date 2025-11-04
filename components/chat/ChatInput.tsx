'use client';

import { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
}

export default function ChatInput({ onSend, disabled = false, placeholder = 'Type your message...', autoFocus = false }: ChatInputProps) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus when autoFocus prop becomes true
  useEffect(() => {
    if (autoFocus && !disabled && inputRef.current) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [autoFocus, disabled]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className="flex-1 bg-white rounded-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] shadow-sm disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={disabled || !input.trim()}
        className="bg-[var(--accent)] text-white rounded-full p-3 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
      >
        <Send className="w-5 h-5" />
      </button>
    </form>
  );
}

