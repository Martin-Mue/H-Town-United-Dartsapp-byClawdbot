import { useEffect, useMemo, useState } from 'react';

type RankingEntry = { playerId: string; rating: number };
type RecentMatch = { matchId: string; mode: string; winnerPlayerId: string | null; players: string[] };
type DashboardSummary = { clubAverage: number; checkoutAverage: number; liveMatches: number; topScore180Count: number };
type ManagedPlayer = {
  id: string;
  displayName: string;
  currentAverage?: number;
  checkoutPercentage?: number;
  pressurePerformanceIndex?: number;
  total180s?: number;
};

const PLAYER_STORAGE_KEY = 'htown-players';

export function StatisticsPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [recent, setRecent] = useState<RecentMatch[]>([]);
  const [error, setError] = useState<string | null>(null);

  const localPlayers = useMemo<ManagedPlayer[]>(() => {
    try {
      const raw = window.localStorage.getItem(PLAYER_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as ManagedPlayer[]) : [];
    } catch {
      return [];
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        setError(null);
        const [summaryResponse, rankingResponse, recentResponse] = await Promise.all([
          fetch('http://localhost:8080/api/analytics/dashboard-summary'),
          fetch('http://localhost:8080/api/global-ranking'),
          fetch('http://localhost:8080/api/game/recent'),
        ]);

        if (!summaryResponse.ok || !rankingResponse.ok || !recentResponse.ok) throw new Error();
        setSummary((await summaryResponse.json()) as DashboardSummary);
        setRanking(((await rankingResponse.json()) as { ranking: RankingEntry[] }).ranking);
        setRecent(((await recentResponse.json()) as { matches: RecentMatch[] }).matches);
      } catch {
        setError('Statistik-Backend aktuell nicht erreichbar.');
      }
    };

    void load();
  }, []);

  return (
    <section className="space-y-4 animate-[fadeIn_.25s_ease]">
      <div className="hero-gradient rounded-2xl border soft-border p-4">
        <h2 className="text-xl uppercase">Statistiken</h2>
        <p className="text-xs muted-text mt-1">Vereinsweite Auswertung, ELO und Spieler-Performance.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Club Average" value={String(summary?.clubAverage ?? 0)} />
        <StatCard label="Checkout %" value={String(summary?.checkoutAverage ?? 0)} />
        <StatCard label="Aktive Matches" value={String(summary?.liveMatches ?? 0)} />
        <StatCard label="180er Gesamt" value={String(summary?.topScore180Count ?? 0)} />
      </div>

      <div className="rounded-2xl card-bg border soft-border p-4">
        <h3 className="text-sm uppercase mb-2">Global Ranking</h3>
        <div className="space-y-2 text-xs">
          {ranking.slice(0, 10).map((entry, index) => (
            <div key={entry.playerId} className="rounded-lg bg-slate-800 p-2 flex items-center justify-between">
              <span>#{index + 1} {entry.playerId}</span>
              <span className="primary-text font-semibold">{entry.rating}</span>
            </div>
          ))}
          {ranking.length === 0 && <p className="muted-text">Noch kein Ranking verfügbar.</p>}
        </div>
      </div>

      <div className="rounded-2xl card-bg border soft-border p-4">
        <h3 className="text-sm uppercase mb-2">Spieler-Übersicht (lokal)</h3>
        <div className="space-y-2 text-xs">
          {localPlayers.map((player) => (
            <div key={player.id} className="rounded-lg bg-slate-800 p-2">
              <p className="font-semibold">{player.displayName}</p>
              <p className="muted-text mt-1">Ø {player.currentAverage ?? 0} · Checkout {player.checkoutPercentage ?? 0}% · Pressure {player.pressurePerformanceIndex ?? 0}</p>
            </div>
          ))}
          {localPlayers.length === 0 && <p className="muted-text">Noch keine lokalen Spielerprofile.</p>}
        </div>
      </div>

      <div className="rounded-2xl card-bg border soft-border p-4">
        <h3 className="text-sm uppercase mb-2">Letzte Spiele</h3>
        <div className="space-y-2 text-xs">
          {recent.map((match) => (
            <div key={match.matchId} className="rounded-lg bg-slate-800 p-2 flex items-center justify-between gap-2">
              <span>{match.players.join(' vs ')} · {match.mode.replace('_', ' ')}</span>
              <span className="primary-text">{match.winnerPlayerId ?? '—'}</span>
            </div>
          ))}
          {recent.length === 0 && <p className="muted-text">Noch keine Matches vorhanden.</p>}
        </div>
      </div>

      {error && <p className="rounded-xl bg-amber-900/40 p-3 text-xs text-amber-100">{error}</p>}
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-xl card-bg border soft-border p-3">
      <p className="text-[11px] muted-text">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </article>
  );
}
