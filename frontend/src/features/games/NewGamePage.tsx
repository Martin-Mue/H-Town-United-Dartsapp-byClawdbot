import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { WinnerBanner } from '../../components/game/WinnerBanner';
import { GameApiClient, type CheckoutMode, type GameMode } from '../../services/GameApiClient';

const apiClient = new GameApiClient('http://localhost:8080');

/** Entry flow for configuring game mode, checkout constraints, and match format. */
export function NewGamePage() {
  const navigate = useNavigate();

  const [mode, setMode] = useState<GameMode>('X01_501');
  const [legsPerSet, setLegsPerSet] = useState(3);
  const [setsToWin, setSetsToWin] = useState(2);
  const [playerOneName, setPlayerOneName] = useState('Player One');
  const [playerTwoName, setPlayerTwoName] = useState('Player Two');
  const [playerOneCheckout, setPlayerOneCheckout] = useState<CheckoutMode>('DOUBLE_OUT');
  const [playerTwoCheckout, setPlayerTwoCheckout] = useState<CheckoutMode>('DOUBLE_OUT');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
          { playerId: 'p1', displayName: playerOneName.trim() || 'Player One', checkoutMode: playerOneCheckout },
          { playerId: 'p2', displayName: playerTwoName.trim() || 'Player Two', checkoutMode: playerTwoCheckout },
        ],
      });

      window.localStorage.setItem('htown-active-match-id', state.matchId);
      navigate(`/match/${state.matchId}`);
    } catch {
      setErrorMessage('Match creation failed. Please ensure backend is running on localhost:8080.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="space-y-3">
      <WinnerBanner text="Configure your next H-Town match" />

      <div className="rounded-2xl card-bg p-4 space-y-3">
        <h2 className="text-sm font-semibold">Game Mode</h2>
        <div className="grid grid-cols-2 gap-2">
          {['X01_301', 'X01_501', 'CRICKET', 'CUSTOM'].map((entry) => (
            <button
              key={entry}
              onClick={() => setMode(entry as GameMode)}
              className={`rounded-xl p-2 text-sm ${mode === entry ? 'bg-sky-400 text-slate-900 font-semibold' : 'bg-slate-800 text-slate-200'}`}
            >
              {entry.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl card-bg p-4 space-y-3">
        <h2 className="text-sm font-semibold">Players</h2>
        <input value={playerOneName} onChange={(event) => setPlayerOneName(event.target.value)} className="w-full rounded-xl bg-slate-800 p-2 text-sm" />
        <input value={playerTwoName} onChange={(event) => setPlayerTwoName(event.target.value)} className="w-full rounded-xl bg-slate-800 p-2 text-sm" />
      </div>

      <div className="rounded-2xl card-bg p-4 space-y-3">
        <h2 className="text-sm font-semibold">Match Configuration</h2>
        <label className="block text-xs muted-text">Legs per Set: {legsPerSet}</label>
        <input type="range" min={1} max={7} value={legsPerSet} onChange={(e) => setLegsPerSet(Number(e.target.value))} className="w-full" />

        <label className="block text-xs muted-text">Sets to Win: {setsToWin}</label>
        <input type="range" min={1} max={5} value={setsToWin} onChange={(e) => setSetsToWin(Number(e.target.value))} className="w-full" />
      </div>

      <div className="rounded-2xl card-bg p-4 space-y-3">
        <h2 className="text-sm font-semibold">Per-Player Checkout</h2>
        <CheckoutSelector label={playerOneName || 'Player One'} value={playerOneCheckout} onChange={setPlayerOneCheckout} />
        <CheckoutSelector label={playerTwoName || 'Player Two'} value={playerTwoCheckout} onChange={setPlayerTwoCheckout} />
      </div>

      {errorMessage && <p className="rounded-xl bg-red-900/40 p-3 text-sm text-red-100">{errorMessage}</p>}

      <button onClick={createMatch} disabled={isSubmitting} className="w-full rounded-xl bg-sky-400 p-3 text-slate-900 font-semibold disabled:opacity-60">
        {isSubmitting ? 'Creating match…' : 'Create Match'}
      </button>
    </section>
  );
}

function CheckoutSelector({
  label,
  value,
  onChange,
}: {
  label: string;
  value: CheckoutMode;
  onChange: (value: CheckoutMode) => void;
}) {
  const options: CheckoutMode[] = ['SINGLE_OUT', 'DOUBLE_OUT', 'MASTER_OUT'];

  return (
    <div>
      <p className="text-xs muted-text mb-1">{label}</p>
      <div className="grid grid-cols-3 gap-2">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => onChange(option)}
            className={`rounded-lg p-2 text-xs ${value === option ? 'bg-sky-400 text-slate-900 font-semibold' : 'bg-slate-800 text-slate-200'}`}
          >
            {option.replace('_', ' ')}
          </button>
        ))}
      </div>
    </div>
  );
}
