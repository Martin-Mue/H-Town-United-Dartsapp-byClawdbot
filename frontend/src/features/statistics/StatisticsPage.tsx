import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { computePlayerRankingStats, sortByMetric, type HistoryEntry, type ManagedPlayer, type RankingMetric } from './rankingUtils';

type RankingEntry = { playerId: string; rating: number };
type RecentMatch = { matchId: string; mode: string; winnerPlayerId: string | null; players: string[] };
type DashboardSummary = { clubAverage: number; checkoutAverage: number; liveMatches: number; topScore180Count: number };
type TournamentStateLite = { championPlayerId: string | null; isCompleted: boolean };
type AppSettings = { eloRankingEnabled: boolean; autoRankParticipants: boolean; rankingDefaultMetric: RankingMetric };

const PLAYER_STORAGE_KEY = 'htown-players';
const SETTINGS_KEY = 'htown-app-settings';

export function StatisticsPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [recent, setRecent] = useState<RecentMatch[]>([]);
  const [tournaments, setTournaments] = useState<TournamentStateLite[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [filter, setFilter] = useState<RankingMetric>('ELO');
  const [error, setError] = useState<string | null>(null);

  const appSettings = useMemo<AppSettings>(() => {
    try {
      const raw = window.localStorage.getItem(SETTINGS_KEY);
      const parsed = raw ? (JSON.parse(raw) as Partial<AppSettings>) : {};
      return {
        eloRankingEnabled: parsed.eloRankingEnabled ?? true,
        autoRankParticipants: parsed.autoRankParticipants ?? true,
        rankingDefaultMetric: parsed.rankingDefaultMetric ?? 'ELO',
      };
    } catch {
      return { eloRankingEnabled: true, autoRankParticipants: true, rankingDefaultMetric: 'ELO' };
    }
  }, []);

  const localPlayers = useMemo<ManagedPlayer[]>(() => {
    try {
      const raw = window.localStorage.getItem(PLAYER_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as ManagedPlayer[]) : [];
    } catch {
      return [];
    }
  }, []);

  useEffect(() => {
    setFilter(appSettings.rankingDefaultMetric);
  }, [appSettings.rankingDefaultMetric]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('htown-match-history');
      setHistory(raw ? (JSON.parse(raw) as HistoryEntry[]) : []);
    } catch {
      setHistory([]);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        setError(null);
        const [summaryResponse, rankingResponse, recentResponse, tournamentsResponse] = await Promise.all([
          fetch('http://localhost:8080/api/analytics/dashboard-summary'),
          fetch('http://localhost:8080/api/global-ranking'),
          fetch('http://localhost:8080/api/game/recent'),
          fetch('http://localhost:8080/api/tournaments'),
        ]);

        if (!summaryResponse.ok || !rankingResponse.ok || !recentResponse.ok || !tournamentsResponse.ok) throw new Error();
        setSummary((await summaryResponse.json()) as DashboardSummary);
        setRanking(((await rankingResponse.json()) as { ranking: RankingEntry[] }).ranking);
        setRecent(((await recentResponse.json()) as { matches: RecentMatch[] }).matches);
        setTournaments((await tournamentsResponse.json()) as TournamentStateLite[]);
      } catch {
        setError('Statistik-Backend aktuell nicht erreichbar.');
      }
    };

    void load();
  }, []);

  const rankingRows = useMemo(() => {
    const rows = computePlayerRankingStats(localPlayers, ranking, history, tournaments);
    return sortByMetric(rows, filter);
  }, [localPlayers, ranking, history, tournaments, filter]);

  const completedTournaments = tournaments.filter((t) => t.isCompleted).length;

  return (
    <section className="space-y-4 animate-[fadeIn_.25s_ease]">
      <div className="hero-gradient rounded-2xl border soft-border p-4">
        <h2 className="text-xl uppercase">Statistiken</h2>
        <p className="text-xs muted-text mt-1">Vereinsweite Auswertung, Ranking und Gamefication 2026.</p>
        <p className="text-[11px] muted-text mt-2">Pressure-Index = Leistung in Drucksituationen (Decider/Finish unter Druck), Skala 0-100.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Club Average" value={String(summary?.clubAverage ?? 0)} />
        <StatCard label="Checkout %" value={String(summary?.checkoutAverage ?? 0)} />
        <StatCard label="Aktive Matches" value={String(summary?.liveMatches ?? 0)} />
        <StatCard label="Abg. Turniere" value={String(completedTournaments)} />
      </div>

      <div className="rounded-2xl card-bg border soft-border p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm uppercase">Vereinsranking</h3>
          <select value={filter} onChange={(e) => setFilter(e.target.value as RankingMetric)} className="rounded bg-slate-800 p-2 text-xs">
            {appSettings.eloRankingEnabled && <option value="ELO">Nach ELO</option>}
            <option value="MATCH_WINS">Nach Einzelsiegen</option>
            <option value="TOURNAMENT_WINS">Nach Turniersiegen</option>
            <option value="WIN_STREAK">Nach Siegesserie</option>
            <option value="BADGES">Nach Ehrungen</option>
          </select>
        </div>

        {!appSettings.autoRankParticipants && (
          <p className="rounded bg-amber-900/30 p-2 text-[11px] text-amber-100">Automatisches Ranking ist in den Einstellungen AUS. Anzeige nur als Referenz.</p>
        )}

        <div className="space-y-2 text-xs">
          {rankingRows.slice(0, 12).map((entry, index) => (
            <Link key={entry.playerId} to={`/players/${entry.playerId}`} className="rounded-lg bg-slate-800 p-2 block">
              <div className="flex items-center justify-between">
                <span>#{index + 1} {entry.displayName}</span>
                <span className="primary-text font-semibold">
                  {filter === 'ELO' ? `${entry.elo} ELO` : filter === 'MATCH_WINS' ? `${entry.matchWins} Siege` : filter === 'TOURNAMENT_WINS' ? `${entry.tournamentWins} Titel` : filter === 'WIN_STREAK' ? `${entry.bestWinStreak} in Folge` : `${entry.badges.length} Badges`}
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full rounded bg-slate-700 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 via-sky-400 to-fuchsia-400 transition-all duration-500"
                  style={{ width: `${Math.min(100, (filter === 'ELO' ? (entry.elo - 1000) / 4 : filter === 'MATCH_WINS' ? entry.matchWins * 6 : filter === 'TOURNAMENT_WINS' ? entry.tournamentWins * 24 : filter === 'WIN_STREAK' ? entry.bestWinStreak * 12 : entry.badges.length * 20))}%` }}
                />
              </div>
              {entry.badges.length > 0 && <p className="mt-1 text-[11px] muted-text">🏅 {entry.badges.join(' · ')}</p>}
            </Link>
          ))}
          {rankingRows.length === 0 && <p className="muted-text">Noch kein Vereinsranking verfügbar.</p>}
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
