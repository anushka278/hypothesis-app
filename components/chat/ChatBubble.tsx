'use client';

import { motion } from 'framer-motion';
import { ChatMessage } from '@/lib/types';

interface ChatBubbleProps {
  message: ChatMessage;
  delay?: number;
}

export default function ChatBubble({ message, delay = 0 }: ChatBubbleProps) {
  const isAssistant = message.role === 'assistant';

  // Format content to properly display bullet points
  const formatContent = (content: string) => {
    const lines = content.split('\n');
    const elements: JSX.Element[] = [];
    let currentParagraph: string[] = [];
    let inList = false;

    const flushParagraph = () => {
      if (currentParagraph.length > 0) {
        const paragraphText = currentParagraph.join('\n').trim();
        if (paragraphText) {
          elements.push(
            <p key={`para-${elements.length}`} className="text-sm leading-relaxed mb-2 last:mb-0">
              {paragraphText}
            </p>
          );
        }
        currentParagraph = [];
      }
    };

    const flushList = (listItems: string[]) => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className="list-disc list-inside text-sm leading-relaxed mb-2 space-y-1">
            {listItems.map((item, idx) => (
              <li key={idx} className="ml-2">
                {item.trim()}
              </li>
            ))}
          </ul>
        );
      }
    };

    const listItems: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      
      // Check if this line is a bullet point (starts with -, •, *, or number)
      const isBullet = /^[-•*]\s+/.test(trimmed) || /^\d+[.)]\s+/.test(trimmed);
      
      if (isBullet) {
        // If we were in a paragraph, flush it
        if (currentParagraph.length > 0 && !inList) {
          flushParagraph();
        }
        inList = true;
        // Remove bullet marker and add to list
        const itemText = trimmed.replace(/^[-•*]\s+/, '').replace(/^\d+[.)]\s+/, '').trim();
        if (itemText) {
          listItems.push(itemText);
        }
      } else if (trimmed === '') {
        // Empty line - flush current list or paragraph
        if (inList && listItems.length > 0) {
          flushList(listItems);
          listItems.length = 0;
          inList = false;
        } else if (currentParagraph.length > 0) {
          currentParagraph.push('');
        }
      } else {
        // Regular text line
        if (inList && listItems.length > 0) {
          // Flush the list first
          flushList(listItems);
          listItems.length = 0;
          inList = false;
        }
        currentParagraph.push(line);
      }
    }

    // Flush any remaining content
    if (inList && listItems.length > 0) {
      flushList(listItems);
    } else if (currentParagraph.length > 0) {
      flushParagraph();
    }

    // If no elements were created (empty content), return the original content
    if (elements.length === 0) {
      return <p className="text-sm leading-relaxed">{content}</p>;
    }

    return <div>{elements}</div>;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className={`flex ${isAssistant ? 'justify-start' : 'justify-end'} mb-4`}
    >
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isAssistant
            ? 'bg-white text-foreground shadow-sm'
            : 'bg-[var(--accent)] text-white'
        }`}
      >
        {formatContent(message.content)}
      </div>
    </motion.div>
  );
}

