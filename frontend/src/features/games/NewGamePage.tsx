import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Target, ChevronDown } from 'lucide-react';
import { GameApiClient, type CheckoutMode, type GameMode } from '../../services/GameApiClient';
import { MODE_RULES } from '../training/modeRules';

import { getApiBaseUrl } from '../../services/apiBase';

const apiClient = new GameApiClient(getApiBaseUrl());

type ManagedPlayer = { id: string; displayName: string; preferredCheckoutMode: CheckoutMode; membershipStatus: 'CLUB_MEMBER' | 'TRIAL' };

export function NewGamePage() {
  const navigate = useNavigate();

  const [mode, setMode] = useState<GameMode>('X01_501');
  const [legsPerSet, setLegsPerSet] = useState(3);
  const [setsToWin, setSetsToWin] = useState(2);
  const [playerOneName, setPlayerOneName] = useState('Spieler 1');
  const [playerTwoName, setPlayerTwoName] = useState('Spieler 2');
  const [playerOneCheckout, setPlayerOneCheckout] = useState<CheckoutMode>('DOUBLE_OUT');
  const [playerTwoCheckout, setPlayerTwoCheckout] = useState<CheckoutMode>('DOUBLE_OUT');
  const [showClubPick, setShowClubPick] = useState(false);
  const [bullOffEnabled, setBullOffEnabled] = useState(false);
  const [bullOffLimitType, setBullOffLimitType] = useState<'turns' | 'darts'>('turns');
  const [bullOffLimitValue, setBullOffLimitValue] = useState(20);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cameraAssistEnabled, setCameraAssistEnabled] = useState(true);
  const [setupStep, setSetupStep] = useState<1 | 2 | 3>(1);

  const clubPlayers = useMemo<ManagedPlayer[]>(() => {
    try {
      const raw = window.localStorage.getItem('htown-players');
      return raw ? (JSON.parse(raw) as ManagedPlayer[]) : [];
    } catch {
      return [];
    }
  }, []);

  const activeModeRule = useMemo(() => {
    if (mode === 'CRICKET') return MODE_RULES.find((r) => r.id === 'cricket');
    return MODE_RULES.find((r) => r.id === 'x01-501');
  }, [mode]);

  const existingActiveMatchId = typeof window !== 'undefined' ? window.localStorage.getItem('htown-active-match-id') : null;

  const isSetupComplete = playerOneName.trim().length > 0 && playerTwoName.trim().length > 0;

  const createMatch = async () => {
    try {
      if (existingActiveMatchId) {
        setErrorMessage('Es läuft bereits ein Spiel. Bitte erst im Match sauber beenden.');
        navigate(`/match/${existingActiveMatchId}`);
        return;
      }

      setIsSubmitting(true);
      setErrorMessage(null);

      const state = await apiClient.createMatch({
        mode,
        legsPerSet,
        setsToWin,
        startingPlayerId: 'p1',
        players: [
          { playerId: 'p1', displayName: playerOneName.trim() || 'Spieler 1', checkoutMode: playerOneCheckout },
          { playerId: 'p2', displayName: playerTwoName.trim() || 'Spieler 2', checkoutMode: playerTwoCheckout },
        ],
      });

      window.localStorage.setItem('htown-active-match-id', state.matchId);
      window.localStorage.setItem(`htown-match-settings-${state.matchId}`, JSON.stringify({ bullOffEnabled, bullOffLimitType, bullOffLimitValue }));
      navigate(`/match/${state.matchId}?camera=${cameraAssistEnabled ? '1' : '0'}`);
    } catch {
      setErrorMessage('Match creation failed. Bitte Backend/API prüfen (Port 8080 erreichbar?).');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="space-y-4 animate-[fadeIn_.25s_ease]">
      <article className="hero-gradient rounded-2xl border soft-border p-4">
        <h2 className="text-xl uppercase">Spiel erstellen</h2>
        <p className="text-xs muted-text mt-1">Wähle Modus, Spieler und Regeln in 3 Schritten.</p>
      </article>


      <div className="card-bg rounded-2xl border soft-border p-3 space-y-2 text-xs">
        <p className="uppercase muted-text">Setup-Assistent</p>
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((step) => (
            <button
              key={`step-${step}`}
              onClick={() => setSetupStep(step as 1 | 2 | 3)}
              className={`rounded p-2 ${setupStep === step ? 'bg-sky-400 text-slate-900 font-semibold' : 'bg-slate-800'}`}
            >
              Schritt {step}
            </button>
          ))}
        </div>
        <p className="muted-text">
          {setupStep === 1 ? '1/3: Modus wählen' : setupStep === 2 ? '2/3: Spieler festlegen' : '3/3: Regeln prüfen & starten'}
        </p>
      </div>

      <div className={`card-bg rounded-2xl border soft-border p-4 space-y-3 ${setupStep === 1 ? '' : 'opacity-70'}`}>
        <h3 className="text-sm uppercase flex items-center gap-2"><Target size={14} /> Spielmodus</h3>
        <div className="grid grid-cols-2 gap-2">
          {([
            { key: 'X01_301', label: '301' },
            { key: 'X01_501', label: '501' },
            { key: 'CRICKET', label: 'Cricket' },
            { key: 'CUSTOM', label: 'Custom' },
          ] as Array<{ key: GameMode; label: string }>).map((entry) => (
            <button key={entry.key} onClick={() => setMode(entry.key)} className={`rounded-xl p-3 text-sm ${mode === entry.key ? 'bg-sky-400 text-slate-900 font-semibold' : 'bg-slate-800'}`}>
              {entry.label}
            </button>
          ))}
        </div>

        {activeModeRule && (
          <div className="rounded-xl bg-slate-800 p-3 text-xs">
            <p className="font-semibold">{activeModeRule.title}</p>
            <p className="muted-text mt-1"><span className="text-slate-300">Regeln:</span> {activeModeRule.rules}</p>
            <p className="muted-text mt-1"><span className="text-slate-300">Trainiert:</span> {activeModeRule.trains}</p>
          </div>
        )}
      </div>

      <div className={`card-bg rounded-2xl border soft-border p-4 space-y-3 ${setupStep === 2 ? '' : 'opacity-70'}`}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm uppercase">Spieler</h3>
          <button onClick={() => setShowClubPick((v) => !v)} className="rounded-lg bg-slate-800 px-2 py-1 text-xs flex items-center gap-1">
            Vereinsmitglieder auswählen <ChevronDown size={12} />
          </button>
        </div>

        {showClubPick && (
          <div className="grid grid-cols-2 gap-2">
            <select className="rounded-lg bg-slate-800 p-2 text-xs" onChange={(e) => {
              const p = clubPlayers.find((x) => x.id === e.target.value);
              if (!p) return;
              setPlayerOneName(p.displayName);
              setPlayerOneCheckout(p.preferredCheckoutMode);
            }}>
              <option value="">P1 Mitglied wählen</option>
              {clubPlayers.map((p) => <option key={p.id} value={p.id}>{p.displayName}</option>)}
            </select>
            <select className="rounded-lg bg-slate-800 p-2 text-xs" onChange={(e) => {
              const p = clubPlayers.find((x) => x.id === e.target.value);
              if (!p) return;
              setPlayerTwoName(p.displayName);
              setPlayerTwoCheckout(p.preferredCheckoutMode);
            }}>
              <option value="">P2 Mitglied wählen</option>
              {clubPlayers.map((p) => <option key={p.id} value={p.id}>{p.displayName}</option>)}
            </select>
          </div>
        )}

        <input value={playerOneName} onChange={(e) => setPlayerOneName(e.target.value)} className="w-full rounded-xl bg-slate-800 p-3" />
        <input value={playerTwoName} onChange={(e) => setPlayerTwoName(e.target.value)} className="w-full rounded-xl bg-slate-800 p-3" />
      </div>

      <div className={`card-bg rounded-2xl border soft-border p-4 space-y-3 ${setupStep === 3 ? '' : 'opacity-70'}`}>
        <h3 className="text-sm uppercase flex items-center gap-2"><Trophy size={14} /> Match Modi</h3>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <label className="rounded-xl bg-slate-800 p-3"><span className="muted-text">Legs pro Set</span><input type="number" min={1} max={15} value={legsPerSet} onChange={(e) => setLegsPerSet(Number(e.target.value || 1))} className="mt-1 w-full rounded bg-slate-700 p-2" /></label>
          <label className="rounded-xl bg-slate-800 p-3"><span className="muted-text">Sets zum Sieg</span><input type="number" min={1} max={9} value={setsToWin} onChange={(e) => setSetsToWin(Number(e.target.value || 1))} className="mt-1 w-full rounded bg-slate-700 p-2" /></label>
        </div>
      </div>

      <div className="card-bg rounded-2xl border soft-border p-4 space-y-2">
        <h3 className="text-sm uppercase">Checkout</h3>
        <CheckoutSelector label={playerOneName || 'Spieler 1'} value={playerOneCheckout} onChange={setPlayerOneCheckout} />
        <CheckoutSelector label={playerTwoName || 'Spieler 2'} value={playerTwoCheckout} onChange={setPlayerTwoCheckout} />
      </div>


      <div className="card-bg rounded-2xl border soft-border p-4 space-y-3">
        <h3 className="text-sm uppercase">Ausbullen-Regel</h3>
        <button onClick={() => setBullOffEnabled((v) => !v)} className="w-full rounded-lg bg-slate-800 p-2 text-xs text-left">
          Ausbullen aktiviert: <span className="primary-text font-semibold">{bullOffEnabled ? 'Ja' : 'Nein'}</span>
        </button>
        {bullOffEnabled && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            <select value={bullOffLimitType} onChange={(e) => setBullOffLimitType(e.target.value as 'turns' | 'darts')} className="rounded bg-slate-800 p-2">
              <option value="turns">nach Runden</option>
              <option value="darts">nach Darts</option>
            </select>
            <input type="number" min={1} value={bullOffLimitValue} onChange={(e) => setBullOffLimitValue(Number(e.target.value || 1))} className="rounded bg-slate-800 p-2" />
          </div>
        )}
      </div>


      <div className="card-bg rounded-2xl border soft-border p-4 space-y-2">
        <h3 className="text-sm uppercase">Kamera-Assist beim Start</h3>
        <button onClick={() => setCameraAssistEnabled((v) => !v)} className="w-full rounded-lg bg-slate-800 p-2 text-xs text-left">
          Kamera direkt aktivieren: <span className="primary-text font-semibold">{cameraAssistEnabled ? 'Ja' : 'Nein'}</span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => setSetupStep((s) => Math.max(1, s - 1) as 1 | 2 | 3)} disabled={setupStep === 1} className="rounded-lg bg-slate-800 p-2 text-sm disabled:opacity-40">Zurück</button>
        <button onClick={() => setSetupStep((s) => Math.min(3, s + 1) as 1 | 2 | 3)} disabled={setupStep === 3} className="rounded-lg bg-slate-800 p-2 text-sm disabled:opacity-40">Weiter</button>
      </div>

      {errorMessage && <p className="rounded-xl bg-red-900/40 p-3 text-sm text-red-100">{errorMessage}</p>}
      <button onClick={createMatch} disabled={isSubmitting || setupStep !== 3 || !isSetupComplete} className="w-full rounded-xl bg-sky-400 p-3 text-slate-900 font-semibold disabled:opacity-50">{isSubmitting ? 'Erstelle Spiel…' : 'Spiel starten'}</button>
    </section>
  );
}

function CheckoutSelector({ label, value, onChange }: { label: string; value: CheckoutMode; onChange: (value: CheckoutMode) => void }) {
  const options: CheckoutMode[] = ['SINGLE_OUT', 'DOUBLE_OUT', 'MASTER_OUT'];
  return <div><p className="text-xs muted-text mb-1">{label}</p><div className="grid grid-cols-3 gap-2">{options.map((option) => <button key={option} onClick={() => onChange(option)} className={`rounded-lg p-2 text-xs ${value === option ? 'bg-sky-400 text-slate-900 font-semibold' : 'bg-slate-800'}`}>{option.replace('_', ' ')}</button>)}</div></div>;
}
