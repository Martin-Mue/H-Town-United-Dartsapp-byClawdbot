import type { PropsWithChildren } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useThemeMode } from '../../app/providers/ThemeProvider';
import { BottomNavigation } from '../navigation/BottomNavigation';

/**
 * Provides mobile-first shell with safe area support and fixed bottom navigation.
 */
export function MobileShell({ children }: PropsWithChildren) {
  const { mode, toggleMode } = useThemeMode();

  return (
    <div className="min-h-full app-bg app-text pb-[calc(84px+env(safe-area-inset-bottom))]">
      <header className="sticky top-0 z-20 border-b border-slate-800/50 panel-bg px-4 pt-[max(12px,env(safe-area-inset-top))] pb-3 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src="/branding/h-town-united-logo-tree.jpg"
              alt="H-Town United Logo"
              className="h-11 w-11 rounded-full border border-slate-600 object-cover"
            />
            <div>
              <h1 className="text-lg font-bold leading-tight">H-Town United Darts</h1>
              <p className="text-xs muted-text">Official Club Platform</p>
            </div>
          </div>

          <button onClick={toggleMode} className="rounded-lg px-2 py-2 card-bg" aria-label="Toggle theme">
            {mode === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </header>
      <main className="px-4 py-4">{children}</main>
      <BottomNavigation />
    </div>
  );
}
