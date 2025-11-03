'use client';

import { useEffect } from 'react';
import { getAppSettings } from '@/lib/storage';
import BottomNav from '@/components/ui/BottomNav';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const settings = getAppSettings();
    const html = document.documentElement;
    if (settings.colorScheme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
    html.setAttribute('data-accent', settings.accentColor);
  }, []);

  return (
    <>
      <div className="min-h-screen bg-background dark:bg-gray-900 pb-16">
        {children}
      </div>
      <BottomNav />
    </>
  );
}

