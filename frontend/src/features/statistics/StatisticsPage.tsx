import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AverageTrendChart } from '../../components/analytics/AverageTrendChart';
import { ThrowHeatmapGrid } from '../../components/analytics/ThrowHeatmapGrid';
import { computePlayerRankingStats, sortByMetric, type HistoryEntry, type ManagedPlayer, type RankingMetric } from './rankingUtils';
import { computeClubKpiSnapshot, computeUnifiedPlayerKpis } from './kpiUtils';

type RankingEntry = { playerId: string; rating: number };
type RecentMatch = { matchId: string; mode: string; winnerPlayerId: string | null; players: string[] };
type DashboardSummary = { clubAverage: number; checkoutAverage: number; liveMatches: number; topScore180Count: number };
type TournamentStateLite = { championPlayerId: string | null; isCompleted: boolean };
type AppSettings = { eloRankingEnabled: boolean; autoRankParticipants: boolean; rankingDefaultMetric: RankingMetric };

const PLAYER_STORAGE_KEY = 'htown-players';
const SETTINGS_KEY = 'htown-app-settings';
const SCORING_BUCKETS = [45, 60, 80, 100, 120, 140, 160, 180] as const;

export function StatisticsPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [recent, setRecent] = useState<RecentMatch[]>([]);
  const [tournaments, setTournaments] = useState<TournamentStateLite[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [filter, setFilter] = useState<RankingMetric>('ELO');
  const [error, setError] = useState<string | null>(null);
  const [modeFilter, setModeFilter] = useState<'all' | 'X01_301' | 'X01_501' | 'CRICKET'>('all');
  const [compareA, setCompareA] = useState<string>('');
  const [compareB, setCompareB] = useState<string>('');

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


  const filteredHistory = useMemo(() => {
    if (modeFilter === 'all') return history;
    return history.filter((h) => h.mode === modeFilter);
  }, [history, modeFilter]);

  const comparePlayers = useMemo(() => {
    const ids = new Set<string>();
    for (const m of filteredHistory) for (const p of m.players) ids.add(p.id);
    const arr = Array.from(ids);
    return arr.map((id) => ({ id, name: localPlayers.find((p) => p.id === id)?.displayName ?? id }));
  }, [filteredHistory, localPlayers]);

  const compareTrend = useMemo(() => {
    const build = (pid: string) => {
      if (!pid) return [] as number[];
      return [...filteredHistory]
        .sort((a, b) => new Date(a.playedAt).getTime() - new Date(b.playedAt).getTime())
        .map((m) => {
          const turns = m.playerTurnScores?.[pid] ?? [];
          if (turns.length === 0) return null;
          return Number((turns.reduce((x, y) => x + y, 0) / turns.length).toFixed(1));
        })
        .filter((v): v is number => v !== null)
        .slice(-12);
    };
    return { a: build(compareA), b: build(compareB) };
  }, [filteredHistory, compareA, compareB]);

  const segmentHeat = useMemo(() => {
    const aggregate = (pid: string) => {
      const segments: Record<string, number> = {};
      const doubles: Record<string, number> = {};
      for (const m of filteredHistory) {
        const stats = m.playerSegmentStats?.[pid];
        if (!stats) continue;
        for (const [k, v] of Object.entries(stats.segments)) segments[k] = (segments[k] ?? 0) + v;
        for (const [k, v] of Object.entries(stats.doubles)) doubles[k] = (doubles[k] ?? 0) + v;
      }
      return { segments, doubles };
    };
    return { a: aggregate(compareA), b: aggregate(compareB) };
  }, [filteredHistory, compareA, compareB]);

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
    const rows = computePlayerRankingStats(localPlayers, ranking, filteredHistory, tournaments);
    return sortByMetric(rows, filter);
  }, [localPlayers, ranking, filteredHistory, tournaments, filter]);

  const unifiedRows = useMemo(() => computeUnifiedPlayerKpis(filteredHistory), [filteredHistory]);
  const kpiSnapshot = useMemo(() => computeClubKpiSnapshot(filteredHistory), [filteredHistory]);

  const completedTournaments = tournaments.filter((t) => t.isCompleted).length;


  const scoringDistribution = useMemo(() => {
    const allTurns = filteredHistory.flatMap((entry) => Object.values(entry.playerTurnScores ?? {}).flat());
    const countAtLeast = (threshold: number) => allTurns.filter((v) => v >= threshold).length;
    return SCORING_BUCKETS.map((bucket) => ({ bucket, hits: countAtLeast(bucket) }));
  }, [filteredHistory]);


  return (
    <section className="space-y-4 animate-[fadeIn_.25s_ease]">
      <div className="hero-gradient rounded-2xl border soft-border p-4">
        <h2 className="text-xl uppercase">Statistiken</h2>
        <p className="text-xs muted-text mt-1">Vereinsweite Auswertung, Ranking und Gamefication 2026.</p>
        <p className="text-[11px] muted-text mt-2">Pressure-Index = Leistung in Drucksituationen (Decider/Finish unter Druck), Skala 0-100.</p>
      </div>


      <div className="rounded-2xl card-bg border soft-border p-3 flex items-center justify-between gap-2 text-xs">
        <span className="muted-text">Modusfilter</span>
        <select value={modeFilter} onChange={(e) => setModeFilter(e.target.value as 'all' | 'X01_301' | 'X01_501' | 'CRICKET')} className="rounded bg-slate-800 p-2">
          <option value="all">Alle</option>
          <option value="X01_301">301</option>
          <option value="X01_501">501</option>
          <option value="CRICKET">Cricket</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Club Average" value={String(kpiSnapshot.clubAverage || summary?.clubAverage || 0)} />
        <StatCard label="First-9 Ø" value={String(kpiSnapshot.first9Average)} />
        <StatCard label="Checkout %" value={String(kpiSnapshot.checkoutRate || summary?.checkoutAverage || 0)} />
        <StatCard label="Abg. Turniere" value={String(completedTournaments)} />
      </div>


      <div className="rounded-2xl card-bg border soft-border p-4 space-y-2 text-xs">
        <h3 className="text-sm uppercase">KPI-Standard (vereinheitlicht)</h3>
        <p className="muted-text">3-Dart Ø und First-9 Ø werden aus denselben Turn-Daten berechnet (Match/Profil/Statistik). Checkout% = erfolgreiche Checkouts / Checkout-Versuche.</p>
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



      <div className="rounded-2xl card-bg border soft-border p-4 space-y-3">
        <h3 className="text-sm uppercase">Spieler-Vergleich & Trend</h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <select value={compareA} onChange={(e) => setCompareA(e.target.value)} className="rounded bg-slate-800 p-2">
            <option value="">Spieler A</option>
            {comparePlayers.map((p) => <option key={`a-${p.id}`} value={p.id}>{p.name}</option>)}
          </select>
          <select value={compareB} onChange={(e) => setCompareB(e.target.value)} className="rounded bg-slate-800 p-2">
            <option value="">Spieler B</option>
            {comparePlayers.map((p) => <option key={`b-${p.id}`} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded bg-slate-900/50 p-2">
            <p className="text-[11px] muted-text mb-1">Trend Spieler A</p>
            <AverageTrendChart values={compareTrend.a.length > 1 ? compareTrend.a : [0, 0]} />
          </div>
          <div className="rounded bg-slate-900/50 p-2">
            <p className="text-[11px] muted-text mb-1">Trend Spieler B</p>
            <AverageTrendChart values={compareTrend.b.length > 1 ? compareTrend.b : [0, 0]} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded bg-slate-900/50 p-2">
            <p className="text-[11px] muted-text mb-1">Segment-Heatmap A</p>
            <ThrowHeatmapGrid intensity={[[segmentHeat.a.segments['20'] ?? 0, segmentHeat.a.segments['19'] ?? 0, segmentHeat.a.segments['18'] ?? 0, segmentHeat.a.segments['17'] ?? 0],[segmentHeat.a.segments['16'] ?? 0, segmentHeat.a.segments['15'] ?? 0, segmentHeat.a.segments['bull'] ?? 0, segmentHeat.a.segments['bullseye'] ?? 0]]} labels={['20','19','18','17','16','15','Bull','Bullseye']} />
            <p className="text-[11px] muted-text mt-1">Doppel-Treffer: {Object.values(segmentHeat.a.doubles).reduce((x,y)=>x+y,0)}</p>
          </div>
          <div className="rounded bg-slate-900/50 p-2">
            <p className="text-[11px] muted-text mb-1">Segment-Heatmap B</p>
            <ThrowHeatmapGrid intensity={[[segmentHeat.b.segments['20'] ?? 0, segmentHeat.b.segments['19'] ?? 0, segmentHeat.b.segments['18'] ?? 0, segmentHeat.b.segments['17'] ?? 0],[segmentHeat.b.segments['16'] ?? 0, segmentHeat.b.segments['15'] ?? 0, segmentHeat.b.segments['bull'] ?? 0, segmentHeat.b.segments['bullseye'] ?? 0]]} labels={['20','19','18','17','16','15','Bull','Bullseye']} />
            <p className="text-[11px] muted-text mt-1">Doppel-Treffer: {Object.values(segmentHeat.b.doubles).reduce((x,y)=>x+y,0)}</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl card-bg border soft-border p-4">
        <h3 className="text-sm uppercase mb-2">Scoring-Verteilung (persistente Matchdaten)</h3>
        <div className="space-y-2 text-xs">
          {scoringDistribution.map((row) => (
            <div key={row.bucket} className="rounded bg-slate-800 p-2 flex items-center justify-between">
              <span>{row.bucket === 180 ? '180' : `${row.bucket}+`}</span>
              <span className="primary-text font-semibold">{row.hits}</span>
            </div>
          ))}
        </div>
      </div>


      <div className="rounded-2xl card-bg border soft-border p-4">
        <h3 className="text-sm uppercase mb-2">Einheitliche KPI-Tabelle</h3>
        <div className="space-y-1 text-xs">
          {unifiedRows.map((row) => (
            <div key={`u-${row.playerId}`} className="rounded bg-slate-800 p-2">
              <p className="font-semibold">{row.displayName}</p>
              <p className="muted-text">3-Dart Ø {row.threeDartAverage} · First-9 Ø {row.first9Average} · Checkout {row.checkoutRate}%</p>
            </div>
          ))}
          {unifiedRows.length === 0 && <p className="muted-text">Noch keine KPI-Daten vorhanden.</p>}
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
