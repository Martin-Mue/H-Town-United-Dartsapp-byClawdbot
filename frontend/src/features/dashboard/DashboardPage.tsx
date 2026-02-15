import { useState } from 'react';
import { AverageTrendChart } from '../../components/analytics/AverageTrendChart';
import { ThrowHeatmapGrid } from '../../components/analytics/ThrowHeatmapGrid';

/** Dashboard with mobile pull-to-refresh style action and rich KPI cards. */
export function DashboardPage() {
  const [refreshing, setRefreshing] = useState(false);

  const refresh = async () => {
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 900));
    setRefreshing(false);
  };

  return (
    <section className="space-y-3">
      <button onClick={refresh} className="w-full rounded-xl bg-slate-800 p-3 text-sm text-slate-200">
        {refreshing ? 'Refreshing club dashboard…' : 'Pull to refresh (tap simulation)'}
      </button>
      <div className="grid grid-cols-2 gap-3">
        <StatCard title="Club Avg" value="67.4" />
        <StatCard title="Checkout %" value="29.1%" />
        <StatCard title="Live Matches" value="8" />
        <StatCard title="Top 180s" value="43" />
      </div>

      <article className="rounded-2xl bg-panel p-4 shadow-lg shadow-black/20">
        <h3 className="text-sm font-semibold">Average Progression</h3>
        <div className="mt-3">
          <AverageTrendChart values={[54, 58, 61, 60, 66, 68, 71]} />
        </div>
      </article>

      <article className="rounded-2xl bg-panel p-4 shadow-lg shadow-black/20">
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

      <article className="rounded-2xl bg-panel p-4 shadow-lg shadow-black/20">
        <h3 className="text-sm font-semibold">Gamification</h3>
        <div className="mt-2 space-y-2 text-sm">
          <p className="rounded-lg bg-slate-800 p-2">🏅 Skill Level: <span className="text-accent font-semibold">Gold</span></p>
          <p className="rounded-lg bg-slate-800 p-2">🎯 Monthly Challenge: Hit 20 successful checkouts</p>
          <p className="rounded-lg bg-slate-800 p-2">🔥 Rookie Award Race: 2nd place</p>
        </div>
      </article>
    </section>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <article className="rounded-2xl bg-panel p-4 shadow-lg shadow-black/20">
      <p className="text-xs text-slate-400">{title}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </article>
  );
}
