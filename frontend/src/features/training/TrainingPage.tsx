import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Dumbbell, Play, Target, RotateCw, Crosshair, Zap, Trophy, CheckCircle2, BookOpen, Camera, CameraOff } from 'lucide-react';
import { MODE_RULES } from './modeRules';

type ManagedPlayer = {
  id: string;
  displayName: string;
  currentAverage?: number;
  checkoutPercentage?: number;
  pressurePerformanceIndex?: number;
};

type TrainingLog = {
  id: string;
  playerId: string;
  drillId: string;
  completedAt: string;
  score: number;
  metrics: Record<string, number>;
};

type TrainingDrill = {
  id: 'doubles' | 'clock' | 'finish' | 'pressure' | 'random' | 't20';
  name: string;
  description: string;
  icon: typeof Target;
  difficulty: 'Beginner' | 'Advanced' | 'Pro';
  durationMinutes: number;
  category: 'doubles' | 'finishing' | 'accuracy' | 'pressure';
};

const DRILLS: TrainingDrill[] = [
  { id: 'doubles', name: 'Doubles Precision', description: 'Treffe D16, D10, D8 in Serien.', icon: Target, difficulty: 'Beginner', durationMinutes: 15, category: 'doubles' },
  { id: 'clock', name: 'Around the Clock', description: 'Triff 1 bis 20 in richtiger Reihenfolge.', icon: RotateCw, difficulty: 'Beginner', durationMinutes: 12, category: 'accuracy' },
  { id: 'finish', name: '121 Finishing', description: 'Checkouts aus 121 unter Matchbedingungen.', icon: Crosshair, difficulty: 'Advanced', durationMinutes: 14, category: 'finishing' },
  { id: 'pressure', name: 'Pressure Decider', description: 'Decider-Szenarien unter Zeitdruck.', icon: Zap, difficulty: 'Pro', durationMinutes: 20, category: 'pressure' },
  { id: 'random', name: 'Random Checkout', description: 'Zufällige Finishes 2-170 lösen.', icon: Trophy, difficulty: 'Advanced', durationMinutes: 16, category: 'finishing' },
  { id: 't20', name: 'T20 Grind', description: '100 Darts auf T20 mit Trefferquote.', icon: Target, difficulty: 'Advanced', durationMinutes: 18, category: 'accuracy' },
];

const LOG_KEY = 'htown-training-log';
const BOGEY_NUMBERS = new Set([159, 162, 163, 165, 166, 168, 169]);
const VALID_RANDOM_CHECKOUTS = Array.from({ length: 169 }, (_, i) => i + 2).filter((n) => n <= 170 && !BOGEY_NUMBERS.has(n));
const pickRandomCheckoutTarget = () => VALID_RANDOM_CHECKOUTS[Math.floor(Math.random() * VALID_RANDOM_CHECKOUTS.length)] ?? 100;

export function TrainingPage() {
  const [selectedDrill, setSelectedDrill] = useState<TrainingDrill | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [ruleFilter, setRuleFilter] = useState<'all' | 'game' | 'training'>('all');
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [doneLabel, setDoneLabel] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraHint, setCameraHint] = useState<string | null>(null);
  const [trainingMultiplier, setTrainingMultiplier] = useState<1 | 2 | 3>(1);
  const [trainingSegment, setTrainingSegment] = useState<number>(20);
  const [trainingThrows, setTrainingThrows] = useState<Array<{ base: number; mult: 1 | 2 | 3; points: number; target: number; hitTarget: boolean }>>([]);
  const [trainingTarget, setTrainingTarget] = useState<number>(20);


  useEffect(() => {
    if (!selectedDrill) return;
    if (selectedDrill.id === 'finish') setTrainingTarget(121);
    else if (selectedDrill.id === 'random') setTrainingTarget(pickRandomCheckoutTarget());
    else if (selectedDrill.id === 'pressure') setTrainingTarget(40);
    else if (selectedDrill.id === 't20') setTrainingTarget(20);
    else if (selectedDrill.id === 'doubles') setTrainingTarget(1);
    else setTrainingTarget(1);

    setTrainingThrows([]);
    setTrainingMultiplier(1);
    setTrainingSegment(20);
  }, [selectedDrill]);


  const players = useMemo<ManagedPlayer[]>(() => {
    try {
      const raw = window.localStorage.getItem('htown-players');
      return raw ? (JSON.parse(raw) as ManagedPlayer[]) : [];
    } catch {
      return [];
    }
  }, [doneLabel]);

  const logs = useMemo<TrainingLog[]>(() => {
    try {
      const raw = window.localStorage.getItem(LOG_KEY);
      return raw ? (JSON.parse(raw) as TrainingLog[]) : [];
    } catch {
      return [];
    }
  }, [doneLabel]);

  const filteredDrills = filterCategory === 'all' ? DRILLS : DRILLS.filter((d) => d.category === filterCategory);

  const syncedRules = useMemo(() => {
    const playableGameRules = new Set(['x01-501', 'cricket']);
    const playableTrainingRules = new Set(['around-clock', 'checkout-121', 't20-100', 'finish-2-170']);

    return MODE_RULES.map((rule) => {
      const available = rule.kind === 'game' ? playableGameRules.has(rule.id) : playableTrainingRules.has(rule.id);
      return { ...rule, available };
    }).filter((rule) => (ruleFilter === 'all' ? true : rule.kind === ruleFilter));
  }, [ruleFilter]);



  const strictMetrics = useMemo(() => {
    const attempts = trainingThrows.length;
    const targetHits = trainingThrows.filter((d) => d.hitTarget).length;
    const targetMisses = attempts - targetHits;
    const t20Hits = trainingThrows.filter((d) => d.base === 20 && d.mult === 3).length;

    let checkoutAttempts = 0;
    let checkoutsCompleted = 0;
    for (let i = 0; i < trainingThrows.length; i += 3) {
      const turn = trainingThrows.slice(i, i + 3);
      if (turn.length === 0) continue;
      checkoutAttempts += 1;
      const target = turn[0].target;
      const sum = turn.reduce((acc, t) => acc + t.points, 0);
      const last = turn[turn.length - 1];
      const validOut = last.mult === 2 || last.base === 50;
      if (sum === target && validOut) checkoutsCompleted += 1;
    }

    return { attempts, targetHits, targetMisses, t20Hits, checkoutAttempts: Math.max(1, checkoutAttempts), checkoutsCompleted };
  }, [trainingThrows]);

  const autoMetrics = useMemo(() => {
    const darts = trainingThrows;
    const attempts = darts.length;
    const hits = strictMetrics.targetHits;
    const highestReached = attempts > 0 ? Math.max(...darts.map((d) => (d.base >= 1 && d.base <= 20 ? d.base : 1))) : 0;
    const dartsUsed = attempts;
    const checkoutAttempts = strictMetrics.checkoutAttempts;
    const checkoutsCompleted = strictMetrics.checkoutsCompleted;
    const avgDartsForCheckout = attempts > 0 ? Math.max(1, Math.min(9, Math.round(attempts / Math.max(1, checkoutsCompleted)))) : 9;
    const turns = Array.from({ length: Math.ceil(darts.length / 3) }, (_, i) => darts.slice(i * 3, i * 3 + 3)).filter((t) => t.length > 0);
    const scenarioCount = Math.max(1, turns.length);
    const wonScenarios = turns.filter((turn) => {
      const turnTarget = turn[0]?.target ?? 40;
      const sum = turn.reduce((acc, d) => acc + d.points, 0);
      const last = turn[turn.length - 1];
      const validOut = last.mult === 2 || last.base === 50;
      return sum === turnTarget && validOut;
    }).length;
    const t20Hits = strictMetrics.t20Hits;
    const t20Darts = attempts;

    return { attempts, hits, highestReached, dartsUsed, checkoutAttempts, checkoutsCompleted, avgDartsForCheckout, scenarioCount, wonScenarios, t20Hits, t20Darts, hasData: attempts > 0 };
  }, [trainingThrows]);

  const computeScore = (drill: TrainingDrill): { score: number; metrics: Record<string, number> } => {
    switch (drill.id) {
      case 'doubles': {
        const ratio = Math.max(0, Math.min(1, autoMetrics.hits / Math.max(1, autoMetrics.attempts)));
        const sampleQuality = Math.max(0.6, Math.min(1, autoMetrics.attempts / 30));
        return { score: Math.round(ratio * 100 * sampleQuality), metrics: { attempts: autoMetrics.attempts, hits: autoMetrics.hits } };
      }
      case 'clock': {
        const progress = Math.max(0, Math.min(20, autoMetrics.highestReached));
        const parDarts = Math.max(1, progress * 3);
        const efficiency = Math.max(0, Math.min(1, parDarts / Math.max(parDarts, autoMetrics.dartsUsed)));
        return { score: Math.round((progress / 20) * 75 + efficiency * 25), metrics: { highestReached: autoMetrics.highestReached, dartsUsed: autoMetrics.dartsUsed } };
      }
      case 'finish': {
        const success = autoMetrics.checkoutsCompleted / Math.max(1, autoMetrics.checkoutAttempts);
        const speedBonus = Math.max(0, Math.min(1, (6 - autoMetrics.avgDartsForCheckout) / 3));
        return { score: Math.round(success * 75 + speedBonus * 25), metrics: { checkoutsCompleted: autoMetrics.checkoutsCompleted, checkoutAttempts: autoMetrics.checkoutAttempts, avgDartsForCheckout: autoMetrics.avgDartsForCheckout } };
      }
      case 'pressure': {
        const clutch = autoMetrics.wonScenarios / Math.max(1, autoMetrics.scenarioCount);
        const stabilityBonus = Math.max(0.7, Math.min(1, autoMetrics.scenarioCount / 12));
        return { score: Math.round(clutch * 100 * stabilityBonus), metrics: { wonScenarios: autoMetrics.wonScenarios, scenarioCount: autoMetrics.scenarioCount } };
      }
      case 'random': {
        const solved = autoMetrics.checkoutsCompleted / Math.max(1, autoMetrics.checkoutAttempts);
        return { score: Math.round(solved * 100), metrics: { solved: autoMetrics.checkoutsCompleted, tasks: autoMetrics.checkoutAttempts } };
      }
      case 't20': {
        const hitRate = autoMetrics.t20Hits / Math.max(1, autoMetrics.t20Darts);
        return { score: Math.round(hitRate * 100), metrics: { t20Hits: autoMetrics.t20Hits, t20Darts: autoMetrics.t20Darts } };
      }
      default:
        return { score: 0, metrics: {} };
    }
  };

  const toggleCamera = async () => {
    if (cameraOn) {
      const stream = videoRef.current?.srcObject as MediaStream | null;
      stream?.getTracks().forEach((track) => track.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
      setCameraOn(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraHint('Kamera aktiv (Training): Eingabe läuft wie im Spiel über Segmente + Multiplikator.');
      setCameraOn(true);
    } catch {
      setCameraHint('Kamera konnte nicht gestartet werden. Bitte Browser-Berechtigung prüfen.');
    }
  };

  const addTrainingDart = () => {
    if (trainingThrows.length >= 120 || !selectedDrill) return;
    const forcedMultiplier = selectedDrill.id === 'doubles' ? 2 : trainingMultiplier;
    const points = trainingSegment === 50 ? 50 : Math.min(60, trainingSegment * forcedMultiplier);

    const hitClockTarget = trainingTarget === 25
      ? (trainingSegment === 25 || trainingSegment === 50)
      : trainingSegment === trainingTarget;
    const hitDoubleTarget = forcedMultiplier === 2 && trainingSegment === trainingTarget;
    const hitT20Target = trainingSegment === 20 && forcedMultiplier === 3;

    const hitTarget = selectedDrill.id === 'clock'
      ? hitClockTarget
      : selectedDrill.id === 'doubles'
        ? hitDoubleTarget
        : selectedDrill.id === 't20'
          ? hitT20Target
          : true;

    const next = { base: trainingSegment, mult: forcedMultiplier as 1 | 2 | 3, points, target: trainingTarget, hitTarget };
    const nextThrows = [...trainingThrows, next];
    setTrainingThrows(nextThrows);

    if (selectedDrill.id === 'clock' && hitClockTarget) {
      setTrainingTarget((t) => (t >= 20 ? 25 : t + 1));
    }
    if (selectedDrill.id === 'doubles' && hitDoubleTarget) {
      setTrainingTarget((t) => Math.min(20, t + 1));
    }
    if (selectedDrill.id === 'random' && nextThrows.length % 3 === 0) {
      const turn = nextThrows.slice(-3);
      const sum = turn.reduce((acc, d) => acc + d.points, 0);
      const last = turn[turn.length - 1];
      const validOut = last.mult === 2 || last.base === 50;
      if (sum === trainingTarget && validOut) setTrainingTarget(pickRandomCheckoutTarget());
    }
  };

  const completeSession = () => {
    if (!selectedDrill || !selectedPlayerId) return;

    const { score, metrics } = computeScore(selectedDrill);
    const entry: TrainingLog = {
      id: crypto.randomUUID(),
      playerId: selectedPlayerId,
      drillId: selectedDrill.id,
      completedAt: new Date().toISOString(),
      score,
      metrics,
    };

    window.localStorage.setItem(LOG_KEY, JSON.stringify([...logs, entry]));

    const rawPlayers = window.localStorage.getItem('htown-players');
    if (rawPlayers) {
      const current = JSON.parse(rawPlayers) as ManagedPlayer[];
      const nextPlayers = current.map((p) => {
        if (p.id !== selectedPlayerId) return p;

        if (selectedDrill.category === 'accuracy') {
          return { ...p, currentAverage: Math.round(((p.currentAverage ?? 50) * 4 + score * 0.6) / 5) };
        }
        if (selectedDrill.category === 'finishing' || selectedDrill.category === 'doubles') {
          return { ...p, checkoutPercentage: Math.round(((p.checkoutPercentage ?? 20) * 4 + score * 0.5) / 5) };
        }
        if (selectedDrill.category === 'pressure') {
          return { ...p, pressurePerformanceIndex: Math.round(((p.pressurePerformanceIndex ?? 50) * 4 + score) / 5) };
        }
        return p;
      });
      window.localStorage.setItem('htown-players', JSON.stringify(nextPlayers));
    }

    setDoneLabel(`${selectedDrill.name} gespeichert (Score ${score}) und Spielerwerte aktualisiert.`);
    setTrainingThrows([]);
    setSelectedDrill(null);
  };

  const drillScorePreview = selectedDrill && autoMetrics.hasData ? computeScore(selectedDrill).score : null;

  if (selectedDrill) {
    return (
      <div className="space-y-4 animate-[fadeIn_.25s_ease]">
        <button onClick={() => setSelectedDrill(null)} className="text-xs muted-text flex items-center gap-1">
          <ArrowLeft size={14} /> Back
        </button>

        <div className="card-bg rounded-2xl border soft-border p-5 space-y-3">
          <div className="text-center">
            <selectedDrill.icon className="w-10 h-10 text-[var(--primary)] mx-auto" />
            <h2 className="text-xl uppercase mt-2">{selectedDrill.name}</h2>
            <p className="text-sm muted-text">{selectedDrill.description}</p>
            <p className="text-xs primary-text mt-1">Aktuelles Ziel: {selectedDrill.id === 'clock' ? (trainingTarget === 25 ? 'Bull' : trainingTarget) : selectedDrill.id === 'doubles' ? `D${trainingTarget}` : selectedDrill.id === 't20' ? 'T20' : selectedDrill.id === 'finish' ? `${trainingTarget} Checkout` : selectedDrill.id === 'random' ? `${trainingTarget} Checkout` : selectedDrill.id === 'pressure' ? `${trainingTarget} Rest` : trainingTarget}</p>
            <p className="text-[11px] muted-text mt-1">Nur regelkonforme Treffer zählen als Zieltreffer.</p>
          </div>

          <select value={selectedPlayerId} onChange={(e) => setSelectedPlayerId(e.target.value)} className="w-full rounded-xl bg-slate-800 p-2 text-sm">
            <option value="">Spieler auswählen</option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>{p.displayName}</option>
            ))}
          </select>

          <div className="rounded-xl border soft-border bg-slate-900/60 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase muted-text">Trainingseingabe (wie Spiel)</p>
              <button onClick={toggleCamera} className="rounded bg-slate-800 px-2 py-1 text-[11px] flex items-center gap-1">
                {cameraOn ? <CameraOff size={12} /> : <Camera size={12} />} {cameraOn ? 'Kamera aus' : 'Kamera'}
              </button>
            </div>

            {cameraOn && <video ref={videoRef} className="w-full rounded-lg border soft-border bg-black" muted playsInline />}
            {cameraHint && <p className="text-[11px] muted-text">{cameraHint}</p>}

            <div className="grid grid-cols-3 gap-1">
              {[1, 2, 3].map((v) => (
                <button key={v} onClick={() => setTrainingMultiplier(v as 1 | 2 | 3)} className={`rounded p-1 text-xs ${trainingMultiplier === v ? 'bg-sky-400 text-slate-900 font-semibold' : 'bg-slate-800'}`}>
                  {v === 1 ? 'Single' : v === 2 ? 'Double' : 'Triple'}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
                <button key={n} onClick={() => setTrainingSegment(n)} className={`rounded p-1 text-xs ${trainingSegment === n ? 'bg-sky-400 text-slate-900 font-semibold' : 'bg-slate-800'}`}>
                  {n}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-1">
              <button onClick={() => { setTrainingSegment(0); setTrainingMultiplier(1); }} className={`rounded p-1 text-xs ${trainingSegment === 0 ? 'bg-sky-400 text-slate-900 font-semibold' : 'bg-slate-800'}`}>Miss</button>
              <button onClick={() => { setTrainingSegment(25); setTrainingMultiplier(1); }} className={`rounded p-1 text-xs ${trainingSegment === 25 ? 'bg-sky-400 text-slate-900 font-semibold' : 'bg-slate-800'}`}>Bull</button>
              <button onClick={() => { setTrainingSegment(50); setTrainingMultiplier(1); }} className={`rounded p-1 text-xs ${trainingSegment === 50 ? 'bg-sky-400 text-slate-900 font-semibold' : 'bg-slate-800'}`}>Bullseye</button>
            </div>

            <button onClick={addTrainingDart} className="w-full rounded bg-slate-800 p-1.5 text-xs">Dart hinzufügen</button>
            {selectedDrill.id === 'random' && <button onClick={() => setTrainingTarget(pickRandomCheckoutTarget())} className="w-full rounded bg-slate-800 p-1.5 text-xs">Neue Zufalls-Zielzahl (2-170)</button>}
            <p className="text-[11px] muted-text">Darts: {trainingThrows.length} · Letzter: {trainingThrows.at(-1) ? `${trainingThrows.at(-1)?.base}x${trainingThrows.at(-1)?.mult}` : '—'}</p>
            <p className="text-[11px] muted-text">Je nach Modus wird ein Zielsegment/Zielcheckout vorgegeben und live aktualisiert. Around the Clock endet mit Bull/Bullseye.</p>
            <p className="text-[11px] muted-text mt-1">Nur regelkonforme Treffer zählen als Zieltreffer.</p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <ReadOnlyField label="Versuche (automatisch)" value={autoMetrics.attempts} />
            <ReadOnlyField label="Zieltreffer (automatisch)" value={autoMetrics.hits} />
            <ReadOnlyField label="Zielverfehlungen" value={strictMetrics.targetMisses} />
            <ReadOnlyField label="Benötigte Darts (automatisch)" value={autoMetrics.dartsUsed} />
            <ReadOnlyField label="Checkout-Versuche (automatisch)" value={autoMetrics.checkoutAttempts} />
            <ReadOnlyField label="Erfolgreiche Checkouts (automatisch)" value={autoMetrics.checkoutsCompleted} />
            <ReadOnlyField label="Pressure Szenarien (automatisch)" value={autoMetrics.scenarioCount} />
            <ReadOnlyField label="Gewonnene Pressure-Szenarien" value={autoMetrics.wonScenarios} />
            <ReadOnlyField label="T20 Treffer (automatisch)" value={autoMetrics.t20Hits} />
            <ReadOnlyField label="T20 Darts (automatisch)" value={autoMetrics.t20Darts} />
          </div>

          <div className="rounded-lg bg-slate-800 p-2 text-xs muted-text">
            <p>Berechneter Trainingsscore: <span className="primary-text font-semibold">{drillScorePreview ?? "—"}</span>{drillScorePreview !== null ? "/100" : ""}</p>
            <p className="mt-1">Interpretation: basiert auf erfassten Darts und Modusregeln. &lt;40 = Trainingsbedarf · 40-70 = solide Basis · &gt;70 = stark.</p>
            <p className="text-[11px] muted-text mt-1">Nur regelkonforme Treffer zählen als Zieltreffer.</p>
          </div>

          <button disabled={!selectedPlayerId || !autoMetrics.hasData} onClick={completeSession} className="w-full rounded-xl bg-sky-400 p-3 font-semibold text-slate-900 flex items-center justify-center gap-2 disabled:opacity-60">
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
        <div>
          <h2 className="text-lg uppercase">Training</h2>
          <p className="text-xs muted-text">Alle Trainingsmodi mit echter Modus-spezifischer Logik.</p>
          <p className="text-[11px] muted-text mt-1">Pressure-Index wird aus Decider-/Druckübungen berechnet (0-100).</p>
        </div>
      </div>

      {doneLabel && (
        <p className="rounded-xl bg-emerald-900/30 p-3 text-xs text-emerald-200 flex items-center gap-2">
          <CheckCircle2 size={14} /> {doneLabel}
        </p>
      )}

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

      <div className="rounded-2xl card-bg border soft-border p-4">
        <h3 className="text-sm uppercase mb-2 flex items-center gap-2"><BookOpen size={14} /> Spiel- & Trainingsregeln</h3>
        <p className="text-xs muted-text mb-2">Filterbar und mit dem aktuell verfügbaren Modusumfang synchronisiert.</p>

        <div className="flex gap-2 mb-2">
          {([
            { key: 'all', label: 'Alle' },
            { key: 'game', label: 'Spielmodi' },
            { key: 'training', label: 'Trainingsmodi' },
          ] as const).map((entry) => (
            <button
              key={entry.key}
              onClick={() => setRuleFilter(entry.key)}
              className={`rounded px-2 py-1 text-[11px] ${ruleFilter === entry.key ? 'bg-sky-400 text-slate-900 font-semibold' : 'bg-slate-800 muted-text'}`}
            >
              {entry.label}
            </button>
          ))}
        </div>

        <div className="space-y-2 max-h-80 overflow-auto pr-1">
          {syncedRules.map((rule) => (
            <details key={rule.id} className="rounded bg-slate-800 p-2 text-xs">
              <summary className="cursor-pointer font-semibold flex items-center justify-between gap-2">
                <span>{rule.title} <span className="muted-text">({rule.kind === 'game' ? 'Spielmodus' : 'Trainingsmodus'})</span></span>
                <span className={`text-[10px] rounded px-1.5 py-0.5 ${rule.available ? 'bg-emerald-900/40 text-emerald-200' : 'bg-amber-900/40 text-amber-200'}`}>
                  {rule.available ? 'verfügbar' : 'geplant'}
                </span>
              </summary>
              <p className="mt-2"><span className="muted-text">Regeln:</span> {rule.rules}</p>
              <p className="mt-1"><span className="muted-text">Trainiert:</span> {rule.trains}</p>
            </details>
          ))}
        </div>
      </div>

      <div className="rounded-2xl card-bg border soft-border p-4">
        <h3 className="text-sm uppercase mb-2">Letzte Trainings</h3>
        <div className="space-y-2 text-xs">
          {logs.slice(-8).reverse().map((l) => (
            <div key={l.id} className="rounded bg-slate-800 p-2">
              {new Date(l.completedAt).toLocaleString('de-DE')} · {l.drillId} · Score {l.score}
            </div>
          ))}
          {logs.length === 0 && <p className="muted-text">Noch keine Trainings gespeichert.</p>}
        </div>
      </div>
    </section>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-slate-800 p-2">
      <span className="block muted-text mb-1">{label}</span>
      <p className="rounded bg-slate-700 p-1 font-semibold">{value}</p>
    </div>
  );
}
