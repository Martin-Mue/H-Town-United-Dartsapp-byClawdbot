import { AnimatePresence, motion } from 'framer-motion';
import { useLocation, Routes, Route } from 'react-router-dom';
import { MobileShell } from '../../components/layout/MobileShell';
import { DashboardPage } from '../../features/dashboard/DashboardPage';
import { PlayersPage } from '../../features/players/PlayersPage';
import { NewGamePage } from '../../features/games/NewGamePage';
import { TournamentsPage } from '../../features/tournaments/TournamentsPage';
import { SettingsPage } from '../../features/settings/SettingsPage';

/** Defines route map and animated slide transitions between screens. */
export function AppRouter() {
  const location = useLocation();

  return (
    <MobileShell>
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -20, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Routes location={location}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/players" element={<PlayersPage />} />
            <Route path="/new-game" element={<NewGamePage />} />
            <Route path="/tournaments" element={<TournamentsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
    </MobileShell>
  );
}
