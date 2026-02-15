import { useState } from 'react';

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
