import { Home, Trophy, Users, PlusCircle } from 'lucide-react';
import { NavLink } from 'react-router-dom';

/** Fixed native-style bottom navigation for primary mobile flows. */
export function BottomNavigation() {
  const entries = [
    { to: '/', label: 'Dashboard', icon: Home },
    { to: '/players', label: 'Players', icon: Users },
    { to: '/new-game', label: 'New Game', icon: PlusCircle },
    { to: '/tournaments', label: 'Tournaments', icon: Trophy },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-800 bg-panel/98 px-2 pb-[max(10px,env(safe-area-inset-bottom))] pt-2">
      <ul className="grid grid-cols-4 gap-1">
        {entries.map((entry) => (
          <li key={entry.to}>
            <NavLink
              to={entry.to}
              className={({ isActive }) =>
                `flex flex-col items-center rounded-xl py-2 text-xs ${isActive ? 'text-accent' : 'text-slate-400'}`
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
