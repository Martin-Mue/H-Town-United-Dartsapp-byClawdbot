import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, BarChart3, Download } from 'lucide-react';
import { AverageTrendChart } from '../../components/analytics/AverageTrendChart';

type HistoryEntry = {
  id: string;
  playedAt: string;
  mode: string;
  players: Array<{ id: string; name: string }>;
  winnerPlayerId: string | null;
  winnerName: string | null;
  resultLabel: string;
};

/** Post-game summary styled after h-town-united stats mindset with export + trend sections. */
export function MatchSummaryScreen() {
  const lastMatch = useMemo<HistoryEntry | null>(() => {
    try {
      const raw = window.localStorage.getItem('htown-match-history');
      const entries = raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
      return entries[0] ?? null;
    } catch {
      return null;
    }
  }, []);

  const trendValues = useMemo(() => {
    if (!lastMatch) return [42, 48, 55, 51, 58];
    const base = 50 + (lastMatch.winnerName ? 6 : 0);
    return [base - 10, base - 6, base - 2, base + 1, base + 4];
  }, [lastMatch]);

  const exportSummary = () => {
    const payload = {
      matchId: lastMatch?.id ?? 'sample-match',
      winner: lastMatch?.winnerName ?? 'Unknown',
      summary: lastMatch?.resultLabel ?? 'No result data',
      players: lastMatch?.players ?? [],
      mode: lastMatch?.mode ?? 'X01_501',
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
    <section className="space-y-4 animate-[fadeIn_.25s_ease]">
      <div className="hero-gradient rounded-2xl border soft-border p-4">
        <div className="flex items-center gap-2">
          <Trophy size={20} className="text-[var(--accent)]" />
          <h2 className="text-xl uppercase">Match Summary</h2>
        </div>
        <p className="text-xs muted-text mt-1">Post-Game Auswertung im H-Town Stil.</p>
      </div>

      <div className="rounded-2xl card-bg border soft-border p-4 space-y-2 text-sm">
        <p><span className="muted-text">Winner:</span> <span className="font-semibold primary-text">{lastMatch?.winnerName ?? 'Noch kein Sieger'}</span></p>
        <p><span className="muted-text">Mode:</span> {lastMatch?.mode?.replace('_', ' ') ?? '—'}</p>
        <p><span className="muted-text">Result:</span> {lastMatch?.resultLabel ?? '—'}</p>
        <p><span className="muted-text">Players:</span> {lastMatch?.players.map((p) => p.name).join(' vs ') ?? '—'}</p>
      </div>

      <div className="rounded-2xl card-bg border soft-border p-4">
        <h3 className="text-sm uppercase mb-2 flex items-center gap-2"><BarChart3 size={14} /> Leistungs-Trend</h3>
        <AverageTrendChart values={trendValues} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={exportSummary} className="rounded-xl bg-sky-400 p-3 font-semibold text-slate-900 flex items-center justify-center gap-2">
          <Download size={14} /> Export Report
        </button>
        <Link to="/statistics" className="rounded-xl bg-slate-800 p-3 text-center">Zu Statistiken</Link>
      </div>
    </section>
  );
}
