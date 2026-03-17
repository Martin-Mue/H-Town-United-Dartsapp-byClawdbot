import { Home, Trophy, Users, PlusCircle } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';

/** Fixed bottom navigation styled after H-Town United app identity. */
export function BottomNavigation() {
  const navigate = useNavigate();
  const activeMatchId = typeof window !== 'undefined' ? window.localStorage.getItem('htown-active-match-id') : null;
  const lockTo = activeMatchId ? `/match/${activeMatchId}` : null;
  const entries = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/players', label: 'Verein', icon: Users },
    { to: '/new-game', label: 'Spiel', icon: PlusCircle },
    { to: '/tournaments', label: 'Turnier', icon: Trophy },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t soft-border panel-bg px-2 pb-[max(10px,env(safe-area-inset-bottom))] pt-2 backdrop-blur-md">
      <ul className="grid grid-cols-4 gap-1">
        {entries.map((entry) => (
          <li key={entry.to}>
            <NavLink
              to={entry.to}
              onClick={(e) => {
                if (lockTo && entry.to !== '/new-game') {
                  e.preventDefault();
                  navigate(lockTo);
                }
              }}
              className={({ isActive }) =>
                `flex flex-col items-center rounded-xl py-2 text-xs transition ${
                  isActive ? 'primary-text bg-slate-800/60 glow-cyan' : 'muted-text hover:text-white'
                }`
              }
            >
              <entry.icon size={18} />
              <span>{entry.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
