import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AverageTrendChart } from '../../components/analytics/AverageTrendChart';
import { ThrowHeatmapGrid } from '../../components/analytics/ThrowHeatmapGrid';

interface DashboardSummary {
  clubAverage: number;
  checkoutAverage: number;
  liveMatches: number;
  topScore180Count: number;
  activeMatchIds: string[];
}

type ManagedPlayer = {
  id: string;
  displayName: string;
  preferredCheckoutMode: 'SINGLE_OUT' | 'DOUBLE_OUT' | 'MASTER_OUT';
  notes: string;
  currentAverage?: number;
  checkoutPercentage?: number;
  pressurePerformanceIndex?: number;
};

const PLAYER_STORAGE_KEY = 'htown-players';

/** Dashboard with mobile pull-to-refresh style action and rich KPI cards. */
export function DashboardPage() {
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [clock, setClock] = useState(new Date());
  const activeMatchId = window.localStorage.getItem('htown-active-match-id');

  const managedPlayers = useMemo<ManagedPlayer[]>(() => {
    const raw = window.localStorage.getItem(PLAYER_STORAGE_KEY);
    if (!raw) return [];

    try {
      return JSON.parse(raw) as ManagedPlayer[];
    } catch {
      return [];
    }
  }, [refreshing]);

  const loadSummary = async () => {
    try {
      setErrorMessage(null);
      const response = await fetch('http://localhost:8080/api/analytics/dashboard-summary');
      if (!response.ok) throw new Error('bad status');
      const payload = (await response.json()) as DashboardSummary;
      setSummary(payload);
    } catch {
      setErrorMessage('Backend summary unavailable. Start backend to enable live analytics.');
    }
  };

  useEffect(() => {
    void loadSummary();
    const timer = window.setInterval(() => setClock(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const refresh = async () => {
    setRefreshing(true);
    await loadSummary();
    await new Promise((resolve) => setTimeout(resolve, 500));
    setRefreshing(false);
  };

  return (
    <section className="space-y-3">
      <article className="rounded-2xl card-bg p-4 shadow-lg shadow-black/20">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src="/branding/h-town-united-logo-tree.jpg"
              alt="H-Town United Tree Logo"
              className="h-16 w-16 rounded-full border-2 border-slate-500 object-cover"
            />
            <div>
              <h2 className="text-base font-semibold">H-Town United e.V.</h2>
              <p className="text-xs muted-text">Live club desk · {clock.toLocaleTimeString('de-DE')}</p>
            </div>
          </div>
          <button onClick={() => navigate('/new-game')} className="rounded-xl bg-sky-400 px-3 py-2 text-xs font-semibold text-slate-900">
            New Match
          </button>
        </div>
      </article>

      {activeMatchId && (
        <button
          onClick={() => navigate(`/match/${activeMatchId}`)}
          className="w-full rounded-xl bg-sky-500 p-3 text-sm font-semibold text-slate-900"
        >
          Resume Active Match
        </button>
      )}

      <div className="grid grid-cols-2 gap-3">
        <StatCard title="Club Avg" value={summary ? `${summary.clubAverage}` : '—'} />
        <StatCard title="Checkout %" value={summary ? `${summary.checkoutAverage}%` : '—'} />
        <StatCard title="Live Matches" value={summary ? `${summary.liveMatches}` : '—'} />
        <StatCard title="Top 180s" value={summary ? `${summary.topScore180Count}` : '—'} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={refresh} className="rounded-xl bg-slate-800 p-3 text-sm text-slate-200">
          {refreshing ? 'Refreshing…' : 'Refresh Dashboard'}
        </button>
        <button onClick={() => navigate('/players')} className="rounded-xl bg-slate-800 p-3 text-sm text-slate-200">
          Manage Players ({managedPlayers.length})
        </button>
      </div>

      {errorMessage && <p className="rounded-xl bg-amber-900/40 p-3 text-xs text-amber-100">{errorMessage}</p>}

      <article className="rounded-2xl card-bg p-4 shadow-lg shadow-black/20">
        <h3 className="text-sm font-semibold">Registered Players</h3>
        <div className="mt-2 space-y-2">
          {managedPlayers.slice(0, 4).map((player) => (
            <div key={player.id} className="rounded-lg bg-slate-800 p-2 text-xs">
              <span className="font-semibold">{player.displayName}</span>
              <span className="muted-text"> · {player.preferredCheckoutMode.replace('_', ' ')}</span>
            </div>
          ))}
          {managedPlayers.length === 0 && <p className="text-xs muted-text">No players stored yet.</p>}
        </div>
      </article>

      <article className="rounded-2xl card-bg p-4 shadow-lg shadow-black/20">
        <h3 className="text-sm font-semibold">Training Focus Today</h3>
        <ul className="mt-2 list-disc pl-4 text-xs muted-text space-y-1">
          <li>Checkout pressure sessions: {managedPlayers.filter((p) => Number(p.checkoutPercentage ?? 0) < 30).length} players</li>
          <li>Scoring consistency drills: {managedPlayers.filter((p) => Number(p.currentAverage ?? 0) < 60).length} players</li>
          <li>Clutch drills: {managedPlayers.filter((p) => Number(p.pressurePerformanceIndex ?? 0) < 65).length} players</li>
        </ul>
      </article>

      <article className="rounded-2xl card-bg p-4 shadow-lg shadow-black/20">
        <h3 className="text-sm font-semibold">Average Progression</h3>
        <div className="mt-3">
          <AverageTrendChart values={[54, 58, 61, 60, 66, 68, 71]} />
        </div>
      </article>

      <article className="rounded-2xl card-bg p-4 shadow-lg shadow-black/20">
        <h3 className="text-sm font-semibold">Throw Heatmap</h3>
        <div className="mt-3">
          <ThrowHeatmapGrid
            intensity={[
              [0.2, 0.4, 0.7, 0.5, 0.3, 0.2],
              [0.3, 0.8, 0.9, 0.8, 0.4, 0.3],
              [0.4, 0.9, 1, 0.9, 0.5, 0.4],
              [0.3, 0.7, 0.8, 0.7, 0.4, 0.3],
            ]}
          />
        </div>
      </article>
    </section>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <article className="rounded-2xl card-bg p-4 shadow-lg shadow-black/20">
      <p className="text-xs muted-text">{title}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </article>
  );
}
