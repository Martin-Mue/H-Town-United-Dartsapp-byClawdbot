/** Displays post-match insights and optional export action. */
export function MatchSummaryScreen() {
  const exportSummary = () => {
    const payload = {
      matchId: 'sample-match',
      winner: 'Player One',
      summary: 'Sets 2:1, Leg Avg 68.4',
      generatedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'match-summary.json';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <section className="space-y-3">
      <div className="rounded-2xl bg-panel p-4">
        <h2 className="text-lg font-semibold">Match Summary</h2>
        <p className="text-sm text-slate-300">Winner: Player One</p>
        <p className="text-sm text-slate-300">Sets: 2 - 1</p>
        <p className="text-sm text-slate-300">Personal Record: Highest turn 180</p>
      </div>

      <button onClick={exportSummary} className="w-full rounded-xl bg-accent p-3 font-semibold text-slate-900">
        Export Match Report
      </button>
    </section>
  );
}
