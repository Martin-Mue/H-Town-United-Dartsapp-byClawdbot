import { useMemo, useState } from 'react';
import { ArrowLeft, Dumbbell, Play, Target, RotateCw, Crosshair, Zap, Trophy, CheckCircle2 } from 'lucide-react';

type ManagedPlayer = {
  id: string;
  displayName: string;
  currentAverage?: number;
  checkoutPercentage?: number;
  pressurePerformanceIndex?: number;
};

type TrainingLog = { id: string; playerId: string; drillId: string; completedAt: string; score: number };

type TrainingDrill = {
  id: string;
  name: string;
  description: string;
  icon: typeof Target;
  difficulty: 'Beginner' | 'Advanced' | 'Pro';
  durationMinutes: number;
  category: 'doubles' | 'finishing' | 'accuracy' | 'pressure';
};

const DRILLS: TrainingDrill[] = [
  { id: 'doubles', name: 'Doubles Precision', description: 'Hit D16, D10, D8 in consistent sequence.', icon: Target, difficulty: 'Beginner', durationMinutes: 15, category: 'doubles' },
  { id: 'clock', name: 'Around the Clock', description: 'Hit 1-20 in order with minimal misses.', icon: RotateCw, difficulty: 'Beginner', durationMinutes: 12, category: 'accuracy' },
  { id: 'finish', name: '121 Finishing', description: 'Checkout from 121 in as few darts as possible.', icon: Crosshair, difficulty: 'Advanced', durationMinutes: 14, category: 'finishing' },
  { id: 'pressure', name: 'Pressure Decider', description: 'Simulate last-leg scenarios under timer.', icon: Zap, difficulty: 'Pro', durationMinutes: 20, category: 'pressure' },
  { id: 'random', name: 'Random Checkout', description: 'Solve random finish numbers between 2 and 170.', icon: Trophy, difficulty: 'Advanced', durationMinutes: 16, category: 'finishing' },
];

const LOG_KEY = 'htown-training-log';

export function TrainingPage() {
  const [selectedDrill, setSelectedDrill] = useState<TrainingDrill | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [sessionScore, setSessionScore] = useState(75);
  const [doneLabel, setDoneLabel] = useState<string | null>(null);

  const players = useMemo<ManagedPlayer[]>(() => {
    try {
      const raw = window.localStorage.getItem('htown-players');
      return raw ? (JSON.parse(raw) as ManagedPlayer[]) : [];
    } catch {
      return [];
    }
  }, []);

  const logs = useMemo<TrainingLog[]>(() => {
    try {
      const raw = window.localStorage.getItem(LOG_KEY);
      return raw ? (JSON.parse(raw) as TrainingLog[]) : [];
    } catch {
      return [];
    }
  }, [doneLabel]);

  const filteredDrills = filterCategory === 'all' ? DRILLS : DRILLS.filter((d) => d.category === filterCategory);

  const completeSession = () => {
    if (!selectedDrill || !selectedPlayerId) return;
    const entry: TrainingLog = {
      id: crypto.randomUUID(),
      playerId: selectedPlayerId,
      drillId: selectedDrill.id,
      completedAt: new Date().toISOString(),
      score: sessionScore,
    };
    const nextLogs = [...logs, entry];
    window.localStorage.setItem(LOG_KEY, JSON.stringify(nextLogs));

    const rawPlayers = window.localStorage.getItem('htown-players');
    if (rawPlayers) {
      const current = JSON.parse(rawPlayers) as ManagedPlayer[];
      const nextPlayers = current.map((p) => {
        if (p.id !== selectedPlayerId) return p;
        if (selectedDrill.category === 'accuracy') return { ...p, currentAverage: Math.round(((p.currentAverage ?? 50) * 4 + sessionScore / 2) / 5) };
        if (selectedDrill.category === 'finishing') return { ...p, checkoutPercentage: Math.round(((p.checkoutPercentage ?? 20) * 4 + sessionScore / 2) / 5) };
        if (selectedDrill.category === 'pressure') return { ...p, pressurePerformanceIndex: Math.round(((p.pressurePerformanceIndex ?? 50) * 4 + sessionScore) / 5) };
        return p;
      });
      window.localStorage.setItem('htown-players', JSON.stringify(nextPlayers));
    }

    setDoneLabel('Training gespeichert und Spielerstatistik aktualisiert.');
    setSelectedDrill(null);
  };

  if (selectedDrill) {
    return (
      <div className="space-y-4 animate-[fadeIn_.25s_ease]">
        <button onClick={() => setSelectedDrill(null)} className="text-xs muted-text flex items-center gap-1"><ArrowLeft size={14} /> Back</button>
        <div className="card-bg rounded-2xl border soft-border p-5 text-center space-y-3">
          <selectedDrill.icon className="w-10 h-10 text-[var(--primary)] mx-auto" />
          <h2 className="text-xl uppercase">{selectedDrill.name}</h2>
          <p className="text-sm muted-text">{selectedDrill.description}</p>

          <select value={selectedPlayerId} onChange={(e) => setSelectedPlayerId(e.target.value)} className="w-full rounded-xl bg-slate-800 p-2 text-sm">
            <option value="">Spieler auswählen</option>
            {players.map((p) => <option key={p.id} value={p.id}>{p.displayName}</option>)}
          </select>

          <label className="block text-xs muted-text text-left">Trainingsscore ({sessionScore})</label>
          <input type="range" min={1} max={100} value={sessionScore} onChange={(e) => setSessionScore(Number(e.target.value))} className="w-full" />

          <button disabled={!selectedPlayerId} onClick={completeSession} className="w-full rounded-xl bg-sky-400 p-3 font-semibold text-slate-900 flex items-center justify-center gap-2 disabled:opacity-60">
            <Play size={16} /> Training abschließen
          </button>
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-4 animate-[fadeIn_.25s_ease]">
      <div className="hero-gradient rounded-2xl border soft-border p-4 flex items-center gap-3">
        <Dumbbell className="w-6 h-6 text-[var(--primary)]" />
        <div><h2 className="text-lg uppercase">Training</h2><p className="text-xs muted-text">Alle Modi sind jetzt startbar und speichern Ergebnisse.</p></div>
      </div>

      {doneLabel && <p className="rounded-xl bg-emerald-900/30 p-3 text-xs text-emerald-200 flex items-center gap-2"><CheckCircle2 size={14} /> {doneLabel}</p>}

      <div className="flex gap-2 overflow-x-auto pb-1">
        {['all', 'doubles', 'finishing', 'accuracy', 'pressure'].map((cat) => (
          <button key={cat} onClick={() => setFilterCategory(cat)} className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap ${filterCategory === cat ? 'bg-sky-400 text-slate-900 font-semibold' : 'bg-slate-800 muted-text'}`}>
            {cat === 'all' ? 'All' : cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3">
        {filteredDrills.map((drill) => (
          <button key={drill.id} onClick={() => setSelectedDrill(drill)} className="card-bg border soft-border rounded-2xl p-4 text-left hover:border-sky-400/50 transition">
            <div className="flex items-start gap-3"><drill.icon className="w-7 h-7 text-[var(--primary)] shrink-0" /><div><p className="font-semibold text-sm">{drill.name}</p><p className="text-xs muted-text mt-1">{drill.description}</p><p className="text-[10px] muted-text mt-2">{drill.difficulty} · {drill.durationMinutes} min</p></div></div>
          </button>
        ))}
      </div>

      <div className="rounded-2xl card-bg border soft-border p-4">
        <h3 className="text-sm uppercase mb-2">Letzte Trainings</h3>
        <div className="space-y-2 text-xs">
          {logs.slice(-8).reverse().map((l) => (
            <div key={l.id} className="rounded bg-slate-800 p-2">{new Date(l.completedAt).toLocaleString('de-DE')} · {l.drillId} · Score {l.score}</div>
          ))}
          {logs.length === 0 && <p className="muted-text">Noch keine Trainings gespeichert.</p>}
        </div>
      </div>
    </section>
  );
}
