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

type RecentMatch = {
  id: string;
  playedAt: string;
  mode: string;
  players: Array<{ id: string; name: string }>;
  winnerPlayerId: string | null;
  winnerName: string | null;
  resultLabel: string;
};

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
    try {
      const raw = window.localStorage.getItem('htown-match-history');
      setRecentMatches(raw ? (JSON.parse(raw) as RecentMatch[]) : []);
    } catch {
      setRecentMatches([]);
    }
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
        <Stat title="3-Dart Average" value={String(player.currentAverage ?? 0)} />
        <Stat title="Checkout-Quote (%)" value={String(player.checkoutPercentage ?? 0)} />
        <Stat title="Pressure-Index (0-100)" value={String(player.pressurePerformanceIndex ?? 0)} />
        <Stat title="180er gesamt" value={String(player.total180s ?? 0)} />
      </div>

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
          {recentMatches
            .filter((m) => m.players.some((p) => p.id === player.id || p.name === player.displayName))
            .map((m) => (
              <div key={m.id} className="rounded bg-slate-800 p-2">
                <p>{m.players.map((p) => p.name).join(' vs ')} · {m.mode.replace('_', ' ')}</p>
                <p className="muted-text mt-1">{new Date(m.playedAt).toLocaleString('de-DE')} · {m.resultLabel}</p>
                <p className="primary-text mt-1">Sieger: {m.winnerName ?? m.winnerPlayerId ?? '—'}</p>
              </div>
            ))}
          {recentMatches.filter((m) => m.players.some((p) => p.id === player.id || p.name === player.displayName)).length === 0 && <p className="muted-text">Noch keine Matches in der Historie.</p>}
        </div>
      </div>

      <Link to="/statistics" className="block w-full rounded-xl bg-slate-800 p-3 text-sm text-center">Zurück zu Statistiken</Link>
    </section>
  );
}

function Stat({ title, value }: { title: string; value: string }) {
  return <article className="rounded-xl card-bg border soft-border p-3"><p className="muted-text">{title}</p><p className="text-xl font-semibold">{value}</p></article>;
}
