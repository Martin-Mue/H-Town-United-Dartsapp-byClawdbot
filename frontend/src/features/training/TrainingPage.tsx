import { useMemo, useState } from 'react';
import { ArrowLeft, Dumbbell, Play, Target, RotateCw, Crosshair, Zap, Trophy } from 'lucide-react';

type ManagedPlayer = {
  id: string;
  displayName: string;
  currentAverage?: number;
  checkoutPercentage?: number;
  pressurePerformanceIndex?: number;
};

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

/** Training page with h-town style and adaptive recommendation block from player analysis. */
export function TrainingPage() {
  const [selectedDrill, setSelectedDrill] = useState<TrainingDrill | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const players = useMemo<ManagedPlayer[]>(() => {
    try {
      const raw = window.localStorage.getItem('htown-players');
      return raw ? (JSON.parse(raw) as ManagedPlayer[]) : [];
    } catch {
      return [];
    }
  }, []);

  const categories = [
    { key: 'all', label: 'All' },
    { key: 'doubles', label: 'Doubles' },
    { key: 'finishing', label: 'Finishing' },
    { key: 'accuracy', label: 'Accuracy' },
    { key: 'pressure', label: 'Pressure' },
  ];

  const filteredDrills = filterCategory === 'all' ? DRILLS : DRILLS.filter((d) => d.category === filterCategory);

  const adaptiveSummary = {
    checkoutFocus: players.filter((p) => (p.checkoutPercentage ?? 0) < 30).length,
    scoringFocus: players.filter((p) => (p.currentAverage ?? 0) < 60).length,
    pressureFocus: players.filter((p) => (p.pressurePerformanceIndex ?? 0) < 65).length,
  };

  if (selectedDrill) {
    return (
      <div className="space-y-4 animate-[fadeIn_.25s_ease]">
        <button onClick={() => setSelectedDrill(null)} className="text-xs muted-text flex items-center gap-1">
          <ArrowLeft size={14} /> Back
        </button>

        <div className="card-bg rounded-2xl border soft-border p-5 text-center">
          <selectedDrill.icon className="w-10 h-10 text-[var(--primary)] mx-auto mb-2" />
          <h2 className="text-xl uppercase">{selectedDrill.name}</h2>
          <p className="text-sm muted-text mt-2">{selectedDrill.description}</p>
          <p className="text-xs muted-text mt-2">{selectedDrill.difficulty} · ~{selectedDrill.durationMinutes} min</p>

          <button className="w-full mt-4 rounded-xl bg-sky-400 p-3 font-semibold text-slate-900 flex items-center justify-center gap-2">
            <Play size={16} /> Start Training
          </button>
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-4 animate-[fadeIn_.25s_ease]">
      <div className="hero-gradient rounded-2xl border soft-border p-4 flex items-center gap-3">
        <Dumbbell className="w-6 h-6 text-[var(--primary)]" />
        <div>
          <h2 className="text-lg uppercase">Training</h2>
          <p className="text-xs muted-text">Adaptive drills based on current player performance</p>
        </div>
      </div>

      <div className="card-bg rounded-2xl border soft-border p-4 text-xs space-y-1">
        <p>Checkout focus needed: <span className="font-semibold">{adaptiveSummary.checkoutFocus}</span> players</p>
        <p>Scoring consistency focus: <span className="font-semibold">{adaptiveSummary.scoringFocus}</span> players</p>
        <p>Pressure resilience focus: <span className="font-semibold">{adaptiveSummary.pressureFocus}</span> players</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setFilterCategory(cat.key)}
            className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap ${
              filterCategory === cat.key ? 'bg-sky-400 text-slate-900 font-semibold' : 'bg-slate-800 muted-text'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3">
        {filteredDrills.map((drill) => (
          <button
            key={drill.id}
            onClick={() => setSelectedDrill(drill)}
            className="card-bg border soft-border rounded-2xl p-4 text-left hover:border-sky-400/50 transition"
          >
            <div className="flex items-start gap-3">
              <drill.icon className="w-7 h-7 text-[var(--primary)] shrink-0" />
              <div>
                <p className="font-semibold text-sm">{drill.name}</p>
                <p className="text-xs muted-text mt-1">{drill.description}</p>
                <p className="text-[10px] muted-text mt-2">{drill.difficulty} · {drill.durationMinutes} min</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
