'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageCircle, BarChart3, Lightbulb, BookOpen, User } from 'lucide-react';

const tabs = [
  { name: 'Chat', href: '/chat', icon: MessageCircle },
  { name: 'Track', href: '/dashboard', icon: BarChart3 },
  { name: 'Insights', href: '/insights', icon: Lightbulb },
  { name: 'Library', href: '/library', icon: BookOpen },
  { name: 'Profile', href: '/profile', icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50">
      <div className="max-w-lg mx-auto px-4">
        <div className="flex justify-around items-center h-16">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href || 
              (pathname === '/' && tab.href === '/chat');
            const Icon = tab.icon;
            
            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={`flex flex-col items-center justify-center gap-1 flex-1 transition-colors ${
                  isActive ? 'text-[var(--accent)]' : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs font-medium">{tab.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

