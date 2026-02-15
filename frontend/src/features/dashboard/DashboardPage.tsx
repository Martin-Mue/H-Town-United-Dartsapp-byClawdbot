import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Dumbbell, Target, Trophy, Users } from 'lucide-react';

interface DashboardSummary {
  clubAverage: number;
  checkoutAverage: number;
  liveMatches: number;
  topScore180Count: number;
  activeMatchIds: string[];
}

interface GlobalRankingEntry {
  playerId: string;
  rating: number;
}

interface RecentMatchItem {
  matchId: string;
  mode: 'X01_301' | 'X01_501' | 'CRICKET' | 'CUSTOM';
  winnerPlayerId: string | null;
  players: string[];
}

type ManagedPlayer = {
  id: string;
  displayName: string;
};

const PLAYER_STORAGE_KEY = 'htown-players';

/** Dashboard redesigned to mirror h-town-united layout while keeping live backend data wiring. */
export function DashboardPage() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [ranking, setRanking] = useState<GlobalRankingEntry[]>([]);
  const [recentMatches, setRecentMatches] = useState<RecentMatchItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const managedPlayers = useMemo<ManagedPlayer[]>(() => {
    const raw = window.localStorage.getItem(PLAYER_STORAGE_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as ManagedPlayer[];
    } catch {
      return [];
    }
  }, []);

  const clubRanking = useMemo(() => {
    const localIds = new Set(managedPlayers.map((p) => p.id));
    return ranking.filter((entry) => localIds.has(entry.playerId));
  }, [ranking, managedPlayers]);

  const loadData = async () => {
    try {
      setErrorMessage(null);
      const [summaryResponse, rankingResponse, recentResponse] = await Promise.all([
        fetch('http://localhost:8080/api/analytics/dashboard-summary'),
        fetch('http://localhost:8080/api/global-ranking'),
        fetch('http://localhost:8080/api/game/recent'),
      ]);

      if (!summaryResponse.ok || !rankingResponse.ok || !recentResponse.ok) throw new Error('bad status');
      setSummary((await summaryResponse.json()) as DashboardSummary);
      setRanking(((await rankingResponse.json()) as { ranking: GlobalRankingEntry[] }).ranking);
      setRecentMatches(((await recentResponse.json()) as { matches: RecentMatchItem[] }).matches);
    } catch {
      setErrorMessage('Backend nicht erreichbar. Starte API für Live-Daten.');
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const quickActions = [
    { title: 'Neues Spiel', subtitle: '501 · 301 · Cricket', icon: Target, onClick: () => navigate('/new-game') },
    { title: 'Turnier', subtitle: 'K.O. · Round Robin', icon: Trophy, onClick: () => navigate('/tournaments') },
    { title: 'Statistiken', subtitle: 'Ranglisten & Vergleiche', icon: BarChart3, onClick: () => navigate('/statistics') },
    { title: 'Training', subtitle: 'Drills & Coaching', icon: Dumbbell, onClick: () => navigate('/training') },
  ];

  return (
    <section className="space-y-4 animate-[fadeIn_.25s_ease]">
      <article className="hero-gradient rounded-2xl border soft-border p-5">
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 rounded-xl bg-slate-900 border soft-border flex items-center justify-center glow-cyan">
            <span className="font-bold primary-text text-2xl">H</span>
          </div>
          <div>
            <h2 className="text-3xl uppercase leading-none">H-Town <span className="primary-text">United</span></h2>
            <p className="text-[11px] uppercase tracking-[0.2em] muted-text">Dart Club</p>
          </div>
        </div>
        <p className="mt-4 text-sm muted-text max-w-xl">
          Verwalte deinen Verein, tracke Scores und organisiere Turniere — alles in einer App.
        </p>
      </article>

      <div className="grid grid-cols-3 gap-3">
        <StatTile icon={Users} label="Mitglieder" value={String(managedPlayers.length)} />
        <StatTile icon={Target} label="Spiele" value={String(summary?.liveMatches ?? 0)} />
        <StatTile icon={Trophy} label="Turniere" value="1" />
      </div>

      <div>
        <h3 className="text-xs uppercase tracking-wider muted-text mb-2">Schnellzugriff</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {quickActions.map((action) => (
            <button key={action.title} onClick={action.onClick} className="card-bg rounded-xl border soft-border p-4 text-left hover:border-sky-400/50">
              <action.icon className="w-5 h-5 primary-text mb-2" />
              <p className="font-semibold text-sm">{action.title}</p>
              <p className="text-xs muted-text">{action.subtitle}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs uppercase tracking-wider muted-text mb-2">Letzte Spiele</h3>
        <div className="space-y-2">
          {recentMatches.map((match) => (
            <div key={match.matchId} className="card-bg rounded-xl border soft-border px-3 py-2 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="rounded bg-slate-800 px-2 py-0.5">{match.mode.replace('_', ' ')}</span>
                <span>{match.players.join(' vs ')}</span>
              </div>
              <span className="primary-text">{match.winnerPlayerId ?? '—'}</span>
            </div>
          ))}
          {recentMatches.length === 0 && <div className="card-bg rounded-xl border soft-border px-3 py-3 text-xs muted-text">Noch keine Spiele.</div>}
        </div>
      </div>

      <div>
        <h3 className="text-xs uppercase tracking-wider muted-text mb-2">Vereinsranking (ELO)</h3>
        <div className="space-y-2">
          {clubRanking.slice(0, 5).map((entry, index) => (
            <div key={entry.playerId} className="card-bg rounded-xl border soft-border px-3 py-2 text-xs flex items-center justify-between">
              <span>#{index + 1} {entry.playerId}</span>
              <span className="primary-text font-semibold">{entry.rating}</span>
            </div>
          ))}
          {clubRanking.length === 0 && <div className="card-bg rounded-xl border soft-border px-3 py-2 text-xs muted-text">Noch kein Vereinsranking verfügbar.</div>}
        </div>
      </div>

      {errorMessage && <p className="rounded-xl bg-amber-900/40 p-3 text-xs text-amber-100">{errorMessage}</p>}
    </section>
  );
}

function StatTile({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) {
  return (
    <article className="card-bg rounded-xl border soft-border p-3 text-center">
      <Icon className="w-4 h-4 mx-auto mb-1 primary-text" />
      <p className="text-3xl leading-none font-semibold">{value}</p>
      <p className="text-[11px] muted-text">{label}</p>
    </article>
  );
}
