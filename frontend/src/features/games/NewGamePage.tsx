import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Target, ChevronDown } from 'lucide-react';
import { GameApiClient, type CheckoutMode, type GameMode } from '../../services/GameApiClient';

const apiClient = new GameApiClient('http://localhost:8080');

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const clubPlayers = useMemo<ManagedPlayer[]>(() => {
    try {
      const raw = window.localStorage.getItem('htown-players');
      return raw ? (JSON.parse(raw) as ManagedPlayer[]) : [];
    } catch {
      return [];
    }
  }, []);

  const createMatch = async () => {
    try {
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
      navigate(`/match/${state.matchId}`);
    } catch {
      setErrorMessage('Match creation failed. Bitte Backend auf localhost:8080 starten.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="space-y-4 animate-[fadeIn_.25s_ease]">
      <article className="hero-gradient rounded-2xl border soft-border p-4">
        <h2 className="text-xl uppercase">Spiel erstellen</h2>
        <p className="text-xs muted-text mt-1">Wähle Modus, Spieler und Checkout-Regeln.</p>
      </article>

      <div className="card-bg rounded-2xl border soft-border p-4 space-y-3">
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
      </div>

      <div className="card-bg rounded-2xl border soft-border p-4 space-y-3">
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

      <div className="card-bg rounded-2xl border soft-border p-4 space-y-3">
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

      {errorMessage && <p className="rounded-xl bg-red-900/40 p-3 text-sm text-red-100">{errorMessage}</p>}
      <button onClick={createMatch} disabled={isSubmitting} className="w-full rounded-xl bg-sky-400 p-3 text-slate-900 font-semibold">{isSubmitting ? 'Erstelle Spiel…' : 'Spiel starten'}</button>
    </section>
  );
}

function CheckoutSelector({ label, value, onChange }: { label: string; value: CheckoutMode; onChange: (value: CheckoutMode) => void }) {
  const options: CheckoutMode[] = ['SINGLE_OUT', 'DOUBLE_OUT', 'MASTER_OUT'];
  return <div><p className="text-xs muted-text mb-1">{label}</p><div className="grid grid-cols-3 gap-2">{options.map((option) => <button key={option} onClick={() => onChange(option)} className={`rounded-lg p-2 text-xs ${value === option ? 'bg-sky-400 text-slate-900 font-semibold' : 'bg-slate-800'}`}>{option.replace('_', ' ')}</button>)}</div></div>;
}
