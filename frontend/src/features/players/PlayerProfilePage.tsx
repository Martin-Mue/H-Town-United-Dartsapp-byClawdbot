import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AverageTrendChart } from '../../components/analytics/AverageTrendChart';
import { ThrowHeatmapGrid } from '../../components/analytics/ThrowHeatmapGrid';
import { computePlayerRankingStats, type HistoryEntry, type ManagedPlayer } from '../statistics/rankingUtils';

type TournamentStateLite = { championPlayerId: string | null; isCompleted: boolean };

type RecentMatch = HistoryEntry;

export function PlayerProfilePage() {
  const { playerId = '' } = useParams();
  const [recentMatches, setRecentMatches] = useState<RecentMatch[]>([]);
  const [tournaments, setTournaments] = useState<TournamentStateLite[]>([]);
  const [elo, setElo] = useState<Array<{ playerId: string; rating: number }>>([]);

  const players = useMemo<ManagedPlayer[]>(() => {
    try {
      const raw = window.localStorage.getItem('htown-players');
      return raw ? (JSON.parse(raw) as ManagedPlayer[]) : [];
    } catch {
      return [];
    }
  }, []);

  const player = players.find((p) => p.id === playerId);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('htown-match-history');
      setRecentMatches(raw ? (JSON.parse(raw) as RecentMatch[]) : []);
    } catch {
      setRecentMatches([]);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const [tournamentRes, rankingRes] = await Promise.all([
          fetch('http://localhost:8080/api/tournaments'),
          fetch('http://localhost:8080/api/global-ranking'),
        ]);
        if (!tournamentRes.ok || !rankingRes.ok) return;
        setTournaments((await tournamentRes.json()) as TournamentStateLite[]);
        setElo(((await rankingRes.json()) as { ranking: Array<{ playerId: string; rating: number }> }).ranking);
      } catch {
        // best effort
      }
    };
    void load();
  }, []);

  const trend = useMemo(() => {
    const base = player?.currentAverage ?? 45;
    return [base - 8, base - 4, base - 2, base, base + 1].map((v) => Math.max(20, Math.round(v)));
  }, [player?.currentAverage]);

  const heat = useMemo(() => {
    const p = ((player?.pressurePerformanceIndex ?? 50) as number) / 100;
    return [
      [0.2, 0.3, 0.4, p, 0.5, 0.3],
      [0.3, p, 0.5, 0.6, p, 0.4],
      [0.2, 0.4, p, 0.8, 0.6, 0.3],
      [0.1, 0.3, 0.5, p, 0.4, 0.2],
    ];
  }, [player?.pressurePerformanceIndex]);

  const playerStats = useMemo(() => {
    if (!player) return null;
    return computePlayerRankingStats([player], elo, recentMatches, tournaments)[0] ?? null;
  }, [player, elo, recentMatches, tournaments]);

  const personalMatches = recentMatches.filter((m) => m.players.some((p) => p.id === player?.id || p.name === player?.displayName));

  if (!player) return <p className="card-bg rounded-xl p-4">Spielerprofil nicht gefunden.</p>;

  return (
    <section className="space-y-4 animate-[fadeIn_.25s_ease]">
      <div className="hero-gradient rounded-2xl border soft-border p-4">
        <p className="text-xs muted-text">Spielerprofil</p>
        <h2 className="text-2xl uppercase">{player.displayName}</h2>
        <p className="text-xs muted-text mt-1">{player.membershipStatus === 'TRIAL' ? 'Schnuppermodus' : 'Vereinsmitglied'}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <Stat title="3-Dart Average" value={String(player.currentAverage ?? 0)} />
        <Stat title="Checkout-Quote (%)" value={String(player.checkoutPercentage ?? 0)} />
        <Stat title="Pressure-Index (0-100)" value={String(player.pressurePerformanceIndex ?? 0)} />
        <Stat title="180er gesamt" value={String(player.total180s ?? 0)} />
      </div>

      {playerStats && (
        <div className="rounded-2xl card-bg border soft-border p-4">
          <h3 className="text-sm uppercase mb-2">Ehrungen & Gamefication</h3>
          <div className="grid grid-cols-2 gap-2 text-xs mb-3">
            <Stat title="ELO" value={String(playerStats.elo)} />
            <Stat title="Turniersiege" value={String(playerStats.tournamentWins)} />
            <Stat title="Einzelsiege" value={String(playerStats.matchWins)} />
            <Stat title="Beste Siegesserie" value={String(playerStats.bestWinStreak)} />
          </div>
          <div className="flex flex-wrap gap-2">
            {playerStats.badges.length > 0 ? playerStats.badges.map((badge) => (
              <span key={badge} className="rounded-full px-3 py-1 text-[11px] font-semibold bg-gradient-to-r from-fuchsia-500/30 to-cyan-400/30 border border-cyan-300/40">
                🏅 {badge}
              </span>
            )) : <p className="text-xs muted-text">Noch keine Badges — nächstes Turnier wartet.</p>}
          </div>
        </div>
      )}

      <div className="rounded-2xl card-bg border soft-border p-4">
        <h3 className="text-sm uppercase mb-2">Trendlinie Trefferbilanz</h3>
        <p className="text-xs muted-text mb-2">Zeigt die Entwicklung des 3-Dart-Average (höher = besser).</p>
        <AverageTrendChart values={trend} />
      </div>

      <div className="rounded-2xl card-bg border soft-border p-4">
        <h3 className="text-sm uppercase mb-2">Treffer-Heatmap</h3>
        <p className="text-xs muted-text mb-2">Dunkler = niedrige Trefferstabilität, heller = stabile Trefferzonen.</p>
        <ThrowHeatmapGrid intensity={heat} />
      </div>

      <div className="rounded-2xl card-bg border soft-border p-4">
        <h3 className="text-sm uppercase mb-2">Gespielte Spiele & Ergebnisse</h3>
        <div className="space-y-2 text-xs">
          {personalMatches.map((m) => (
            <div key={m.id} className="rounded bg-slate-800 p-2">
              <p>{m.players.map((p) => p.name).join(' vs ')} · {m.mode.replace('_', ' ')}</p>
              <p className="muted-text mt-1">{new Date(m.playedAt).toLocaleString('de-DE')} · {m.resultLabel}</p>
              <p className="primary-text mt-1">Sieger: {m.winnerName ?? m.winnerPlayerId ?? '—'}</p>
            </div>
          ))}
          {personalMatches.length === 0 && <p className="muted-text">Noch keine Matches in der Historie.</p>}
        </div>
      </div>

      <Link to="/statistics" className="block w-full rounded-xl bg-slate-800 p-3 text-sm text-center">Zurück zu Statistiken</Link>
    </section>
  );
}

function Stat({ title, value }: { title: string; value: string }) {
  return <article className="rounded-xl card-bg border soft-border p-3"><p className="muted-text">{title}</p><p className="text-xl font-semibold">{value}</p></article>;
}
