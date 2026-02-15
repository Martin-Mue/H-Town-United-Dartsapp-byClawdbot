import { useEffect, useState } from 'react';
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

/** Dashboard with mobile pull-to-refresh style action and rich KPI cards. */
export function DashboardPage() {
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const activeMatchId = window.localStorage.getItem('htown-active-match-id');

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
        <div className="flex items-center gap-3">
          <img
            src="/branding/h-town-united-logo-tree.jpg"
            alt="H-Town United Tree Logo"
            className="h-16 w-16 rounded-full border-2 border-slate-500 object-cover"
          />
          <div>
            <h2 className="text-base font-semibold">H-Town United e.V.</h2>
            <p className="text-xs muted-text">Tree identity active across the platform design</p>
          </div>
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

      <button onClick={refresh} className="w-full rounded-xl bg-slate-800 p-3 text-sm text-slate-200">
        {refreshing ? 'Refreshing club dashboard…' : 'Pull to refresh'}
      </button>

      {errorMessage && <p className="rounded-xl bg-amber-900/40 p-3 text-xs text-amber-100">{errorMessage}</p>}

      <div className="grid grid-cols-2 gap-3">
        <StatCard title="Club Avg" value={summary ? `${summary.clubAverage}` : '—'} />
        <StatCard title="Checkout %" value={summary ? `${summary.checkoutAverage}%` : '—'} />
        <StatCard title="Live Matches" value={summary ? `${summary.liveMatches}` : '—'} />
        <StatCard title="Top 180s" value={summary ? `${summary.topScore180Count}` : '—'} />
      </div>

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
