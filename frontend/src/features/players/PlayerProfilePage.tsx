import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AverageTrendChart } from '../../components/analytics/AverageTrendChart';
import { ThrowHeatmapGrid } from '../../components/analytics/ThrowHeatmapGrid';

type ManagedPlayer = {
  id: string;
  displayName: string;
  currentAverage?: number;
  checkoutPercentage?: number;
  pressurePerformanceIndex?: number;
  total180s?: number;
  membershipStatus?: 'CLUB_MEMBER' | 'TRIAL';
};

type RecentMatch = { matchId: string; mode: string; winnerPlayerId: string | null; players: string[] };

export function PlayerProfilePage() {
  const { playerId = '' } = useParams();
  const [recentMatches, setRecentMatches] = useState<RecentMatch[]>([]);

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
    fetch('http://localhost:8080/api/game/recent')
      .then((res) => (res.ok ? res.json() : { matches: [] }))
      .then((data: { matches: RecentMatch[] }) => setRecentMatches(data.matches))
      .catch(() => setRecentMatches([]));
  }, []);

  const trend = useMemo(() => {
    const base = player?.currentAverage ?? 45;
    return [base - 8, base - 4, base - 2, base, base + 1].map((v) => Math.max(20, Math.round(v)));
  }, [player?.currentAverage]);

  const heat = useMemo(() => {
    const p = (player?.pressurePerformanceIndex ?? 50) / 100;
    return [
      [0.2, 0.3, 0.4, p, 0.5, 0.3],
      [0.3, p, 0.5, 0.6, p, 0.4],
      [0.2, 0.4, p, 0.8, 0.6, 0.3],
      [0.1, 0.3, 0.5, p, 0.4, 0.2],
    ];
  }, [player?.pressurePerformanceIndex]);

  if (!player) return <p className="card-bg rounded-xl p-4">Spielerprofil nicht gefunden.</p>;

  return (
    <section className="space-y-4 animate-[fadeIn_.25s_ease]">
      <div className="hero-gradient rounded-2xl border soft-border p-4">
        <p className="text-xs muted-text">Spielerprofil</p>
        <h2 className="text-2xl uppercase">{player.displayName}</h2>
        <p className="text-xs muted-text mt-1">{player.membershipStatus === 'TRIAL' ? 'Schnuppermodus' : 'Vereinsmitglied'}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <Stat title="Average" value={String(player.currentAverage ?? 0)} />
        <Stat title="Checkout %" value={String(player.checkoutPercentage ?? 0)} />
        <Stat title="Pressure" value={String(player.pressurePerformanceIndex ?? 0)} />
        <Stat title="180er" value={String(player.total180s ?? 0)} />
      </div>

      <div className="rounded-2xl card-bg border soft-border p-4">
        <h3 className="text-sm uppercase mb-2">Trendlinie Trefferbilanz</h3>
        <AverageTrendChart values={trend} />
      </div>

      <div className="rounded-2xl card-bg border soft-border p-4">
        <h3 className="text-sm uppercase mb-2">Treffer-Heatmap</h3>
        <ThrowHeatmapGrid intensity={heat} />
      </div>

      <div className="rounded-2xl card-bg border soft-border p-4">
        <h3 className="text-sm uppercase mb-2">Gespielte Spiele & Ergebnisse</h3>
        <div className="space-y-2 text-xs">
          {recentMatches.filter((m) => m.players.includes(player.displayName)).map((m) => (
            <div key={m.matchId} className="rounded bg-slate-800 p-2 flex items-center justify-between">
              <span>{m.players.join(' vs ')} · {m.mode}</span>
              <span className="primary-text">{m.winnerPlayerId ?? '—'}</span>
            </div>
          ))}
          {recentMatches.filter((m) => m.players.includes(player.displayName)).length === 0 && <p className="muted-text">Noch keine Matches in der Historie.</p>}
        </div>
      </div>

      <Link to="/statistics" className="block w-full rounded-xl bg-slate-800 p-3 text-sm text-center">Zurück zu Statistiken</Link>
    </section>
  );
}

function Stat({ title, value }: { title: string; value: string }) {
  return <article className="rounded-xl card-bg border soft-border p-3"><p className="muted-text">{title}</p><p className="text-xl font-semibold">{value}</p></article>;
}
