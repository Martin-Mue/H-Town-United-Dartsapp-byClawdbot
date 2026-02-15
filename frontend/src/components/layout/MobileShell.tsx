import type { PropsWithChildren } from 'react';
import { BottomNavigation } from '../navigation/BottomNavigation';

/**
 * Provides mobile-first shell with safe area support and fixed bottom navigation.
 */
export function MobileShell({ children }: PropsWithChildren) {
  return (
    <div className="min-h-full bg-surface text-white pb-[calc(84px+env(safe-area-inset-bottom))]">
      <header className="sticky top-0 z-20 border-b border-slate-800 bg-panel/95 px-4 pt-[max(12px,env(safe-area-inset-top))] pb-3 backdrop-blur">
        <h1 className="text-lg font-bold">H-Town United Darts</h1>
      </header>
      <main className="px-4 py-4">{children}</main>
      <BottomNavigation />
    </div>
  );
}
