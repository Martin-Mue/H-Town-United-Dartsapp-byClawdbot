import type { PropsWithChildren } from 'react';
import { Sun, Moon, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useThemeMode } from '../../app/providers/ThemeProvider';
import { BottomNavigation } from '../navigation/BottomNavigation';

/**
 * Provides mobile-first shell with H-Town visual identity and fixed bottom navigation.
 */
export function MobileShell({ children }: PropsWithChildren) {
  const { mode, toggleMode } = useThemeMode();
  const activeMatchId = typeof window !== 'undefined' ? window.localStorage.getItem('htown-active-match-id') : null;

  return (
    <div className="min-h-full app-bg app-text pb-[calc(84px+env(safe-area-inset-bottom))]">
      <header className="sticky top-0 z-20 border-b soft-border panel-bg px-4 pt-[max(12px,env(safe-area-inset-top))] pb-3 backdrop-blur">
        <div className="hero-gradient rounded-2xl border soft-border px-3 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <img
                src="/branding/h-town-united-logo-tree.jpg"
                alt="H-Town United Logo"
                className="h-11 w-11 rounded-full border soft-border object-cover glow-cyan"
              />
              <div>
                <h1 className="text-lg uppercase leading-tight">H-Town <span className="primary-text">United</span></h1>
                <p className="text-[10px] uppercase tracking-[0.2em] muted-text">Dart Club Platform</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link to="/settings" className="rounded-lg px-2 py-2 card-bg soft-border border" aria-label="Open settings">
                <Settings size={16} />
              </Link>
              <button onClick={toggleMode} className="rounded-lg px-2 py-2 card-bg soft-border border" aria-label="Toggle theme">
                {mode === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            </div>
          </div>
        </div>
      </header>
      <main className="px-4 py-4">
        {activeMatchId && (
          <Link to={`/match/${activeMatchId}`} className="mb-3 block rounded-lg border border-amber-300/40 bg-amber-900/20 px-3 py-2 text-xs text-amber-100">
            Aktives Spiel läuft. Erst im Match beenden, bevor du in andere Menüs wechselst.
          </Link>
        )}
        {children}
      </main>
      <BottomNavigation />
    </div>
  );
}
