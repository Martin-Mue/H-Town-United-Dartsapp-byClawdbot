import { useMemo, useState } from 'react';

type CheckoutMode = 'SINGLE_OUT' | 'DOUBLE_OUT' | 'MASTER_OUT';

type ManagedPlayer = {
  id: string;
  displayName: string;
  preferredCheckoutMode: CheckoutMode;
  notes: string;
  currentAverage: number;
  checkoutPercentage: number;
  pressurePerformanceIndex: number;
  total180s: number;
  avatarUrl: string;
};

const STORAGE_KEY = 'htown-players';

/** Lists and manages player profiles, weaknesses/strengths, and adaptive training outcomes. */
export function PlayersPage() {
  const [players, setPlayers] = useState<ManagedPlayer[]>(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [
        {
          id: 'p1',
          displayName: 'Player One',
          preferredCheckoutMode: 'DOUBLE_OUT',
          notes: '',
          currentAverage: 61,
          checkoutPercentage: 26,
          pressurePerformanceIndex: 58,
          total180s: 3,
          avatarUrl: '',
        },
        {
          id: 'p2',
          displayName: 'Player Two',
          preferredCheckoutMode: 'DOUBLE_OUT',
          notes: '',
          currentAverage: 56,
          checkoutPercentage: 22,
          pressurePerformanceIndex: 51,
          total180s: 1,
          avatarUrl: '',
        },
      ];
    }

    try {
      const parsed = JSON.parse(raw) as Partial<ManagedPlayer>[];
      return parsed.map((entry, index) => ({
        id: entry.id ?? `p-${index}`,
        displayName: entry.displayName ?? `Player ${index + 1}`,
        preferredCheckoutMode: entry.preferredCheckoutMode ?? 'DOUBLE_OUT',
        notes: entry.notes ?? '',
        currentAverage: Number(entry.currentAverage ?? 55),
        checkoutPercentage: Number(entry.checkoutPercentage ?? 20),
        pressurePerformanceIndex: Number(entry.pressurePerformanceIndex ?? 50),
        total180s: Number(entry.total180s ?? 0),
        avatarUrl: entry.avatarUrl ?? '',
      }));
    } catch {
      return [];
    }
  });

  const [nameInput, setNameInput] = useState('');
  const [modeInput, setModeInput] = useState<CheckoutMode>('DOUBLE_OUT');
  const [notesInput, setNotesInput] = useState('');

  const totalPlayers = useMemo(() => players.length, [players.length]);

  const persist = (nextPlayers: ManagedPlayer[]) => {
    setPlayers(nextPlayers);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextPlayers));
  };

  const addPlayer = () => {
    const displayName = nameInput.trim();
    if (!displayName) return;

    const nextPlayers: ManagedPlayer[] = [
      ...players,
      {
        id: `p-${crypto.randomUUID().slice(0, 8)}`,
        displayName,
        preferredCheckoutMode: modeInput,
        notes: notesInput.trim(),
        currentAverage: 50,
        checkoutPercentage: 20,
        pressurePerformanceIndex: 50,
        total180s: 0,
        avatarUrl: '',
      },
    ];

    persist(nextPlayers);
    setNameInput('');
    setNotesInput('');
    setModeInput('DOUBLE_OUT');
  };

  const removePlayer = (playerId: string) => {
    persist(players.filter((player) => player.id !== playerId));
  };

  const patchPlayer = (playerId: string, patch: Partial<ManagedPlayer>) => {
    persist(players.map((player) => (player.id === playerId ? { ...player, ...patch } : player)));
  };

  const generatePortrait = (player: ManagedPlayer) => {
    const prompt = encodeURIComponent(
      `professional darts athlete portrait, dark sports arena lighting, ${player.displayName}, high detail, realistic`,
    );
    const imageUrl = `https://image.pollinations.ai/prompt/${prompt}?width=512&height=512&seed=${player.id}`;
    patchPlayer(player.id, { avatarUrl: imageUrl });
  };

  return (
    <section className="space-y-3">
      <div className="rounded-2xl card-bg p-4">
        <h2 className="text-base font-semibold">Player Management</h2>
        <p className="text-xs muted-text mt-1">{totalPlayers} registered players in local club roster</p>
      </div>

      <div className="rounded-2xl card-bg p-4 space-y-2">
        <h3 className="text-sm font-semibold">Add New Player</h3>
        <input
          value={nameInput}
          onChange={(event) => setNameInput(event.target.value)}
          placeholder="Display name"
          className="w-full rounded-xl bg-slate-800 p-2 text-sm"
        />
        <select
          value={modeInput}
          onChange={(event) => setModeInput(event.target.value as CheckoutMode)}
          className="w-full rounded-xl bg-slate-800 p-2 text-sm"
        >
          <option value="SINGLE_OUT">Single Out</option>
          <option value="DOUBLE_OUT">Double Out</option>
          <option value="MASTER_OUT">Master Out</option>
        </select>
        <textarea
          value={notesInput}
          onChange={(event) => setNotesInput(event.target.value)}
          placeholder="Notes (optional)"
          className="w-full rounded-xl bg-slate-800 p-2 text-sm"
        />
        <button onClick={addPlayer} className="w-full rounded-xl bg-sky-400 p-2 font-semibold text-slate-900">
          Save Player
        </button>
      </div>

      <div className="space-y-2">
        {players.map((player) => {
          const analysis = analyzePlayer(player);
          const trainingPlan = buildAdaptiveTrainingPlan(player, analysis);

          return (
            <article key={player.id} className="rounded-2xl card-bg p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="w-full">
                  <div className="flex items-center gap-3">
                    <img
                      src={player.avatarUrl || '/branding/h-town-united-logo-tree.jpg'}
                      alt={`${player.displayName} portrait`}
                      className="h-16 w-16 rounded-xl border border-slate-600 object-cover"
                    />
                    <div className="w-full">
                      <input
                        value={player.displayName}
                        onChange={(event) => patchPlayer(player.id, { displayName: event.target.value })}
                        className="w-full rounded-lg bg-slate-800 p-2 text-sm font-semibold"
                      />
                      <button
                        onClick={() => generatePortrait(player)}
                        className="mt-2 rounded-lg bg-slate-800 px-2 py-1 text-xs"
                      >
                        Generate AI Portrait
                      </button>
                    </div>
                  </div>

                  <p className="text-xs muted-text mt-2">Preferred checkout mode</p>
                  <select
                    value={player.preferredCheckoutMode}
                    onChange={(event) => patchPlayer(player.id, { preferredCheckoutMode: event.target.value as CheckoutMode })}
                    className="mt-1 w-full rounded-lg bg-slate-800 p-2 text-xs"
                  >
                    <option value="SINGLE_OUT">Single Out</option>
                    <option value="DOUBLE_OUT">Double Out</option>
                    <option value="MASTER_OUT">Master Out</option>
                  </select>
                </div>
                <button
                  onClick={() => removePlayer(player.id)}
                  className="rounded-lg bg-red-900/40 px-2 py-1 text-xs text-red-100"
                >
                  Remove
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <MetricInput
                  label="Average"
                  value={player.currentAverage}
                  onChange={(value) => patchPlayer(player.id, { currentAverage: value })}
                />
                <MetricInput
                  label="Checkout %"
                  value={player.checkoutPercentage}
                  onChange={(value) => patchPlayer(player.id, { checkoutPercentage: value })}
                />
                <MetricInput
                  label="Pressure Index"
                  value={player.pressurePerformanceIndex}
                  onChange={(value) => patchPlayer(player.id, { pressurePerformanceIndex: value })}
                />
                <MetricInput
                  label="Total 180s"
                  value={player.total180s}
                  onChange={(value) => patchPlayer(player.id, { total180s: value })}
                />
              </div>

              <div className="rounded-lg bg-slate-800 p-2 text-xs">
                <p className="font-semibold">Strengths</p>
                <p className="muted-text mt-1">{analysis.strengths.join(' · ') || 'No clear strengths detected yet'}</p>
                <p className="font-semibold mt-2">Weaknesses</p>
                <p className="muted-text mt-1">{analysis.weaknesses.join(' · ') || 'No major weaknesses detected'}</p>
              </div>

              <div className="rounded-lg bg-slate-800 p-2 text-xs">
                <p className="font-semibold">Adaptive Training Modes</p>
                <ul className="mt-1 list-disc pl-4 muted-text">
                  {trainingPlan.map((entry) => (
                    <li key={entry}>{entry}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-lg bg-slate-800 p-2 text-xs">
                <p className="font-semibold">Achievements</p>
                <p className="muted-text mt-1">{resolveAchievements(player).join(' · ') || 'No achievements unlocked yet'}</p>
              </div>
            </article>
          );
        })}

        {players.length === 0 && (
          <p className="rounded-xl card-bg p-4 text-sm muted-text">No players yet. Add your first club member above.</p>
        )}
      </div>
    </section>
  );
}

function MetricInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="rounded-lg bg-slate-800 p-2">
      <span className="block muted-text">{label}</span>
      <input
        type="number"
        value={Number.isFinite(value) ? value : 0}
        onChange={(event) => onChange(Number(event.target.value || 0))}
        className="mt-1 w-full rounded bg-slate-700 p-1"
      />
    </label>
  );
}

function resolveAchievements(player: ManagedPlayer): string[] {
  const achievements: string[] = [];
  if (player.total180s >= 1) achievements.push('First 180');
  if (player.total180s >= 50) achievements.push('Maximum Machine');
  if (player.checkoutPercentage >= 35) achievements.push('Checkout Specialist');
  if (player.pressurePerformanceIndex >= 75) achievements.push('Clutch Performer');
  if (player.currentAverage >= 70) achievements.push('Gold Tier Average');
  return achievements;
}

function analyzePlayer(player: ManagedPlayer): { strengths: string[]; weaknesses: string[] } {
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  if (player.currentAverage >= 65) strengths.push('Scoring consistency');
  else weaknesses.push('Treble scoring consistency');

  if (player.checkoutPercentage >= 30) strengths.push('Reliable checkouts');
  else weaknesses.push('Checkout conversion under pressure');

  if (player.pressurePerformanceIndex >= 70) strengths.push('Strong pressure handling');
  else weaknesses.push('Decider-leg pressure management');

  if (player.total180s >= 10) strengths.push('High-impact scoring bursts');
  else weaknesses.push('High-score ceiling development');

  return { strengths, weaknesses };
}

function buildAdaptiveTrainingPlan(
  player: ManagedPlayer,
  analysis: { strengths: string[]; weaknesses: string[] },
): string[] {
  const plan: string[] = [];

  if (analysis.weaknesses.includes('Treble scoring consistency')) {
    plan.push('Treble 20 ladder: 10 rounds, accuracy tracking per round');
  }

  if (analysis.weaknesses.includes('Checkout conversion under pressure')) {
    plan.push('Double-out ladder: D16-D10-D8 under 60-second timer');
  }

  if (analysis.weaknesses.includes('Decider-leg pressure management')) {
    plan.push('Pressure drills: best-of-3 mini-legs from 101 start');
  }

  if (analysis.weaknesses.includes('High-score ceiling development')) {
    plan.push('Power scoring block: 15 visits aiming 100+ each');
  }

  if (player.preferredCheckoutMode === 'MASTER_OUT') {
    plan.push('Master out simulation: finish-only rounds with triple/double endings');
  }

  if (plan.length === 0) {
    plan.push('Balanced maintenance: 20 minutes scoring + 20 minutes checkout');
  }

  return plan;
}
