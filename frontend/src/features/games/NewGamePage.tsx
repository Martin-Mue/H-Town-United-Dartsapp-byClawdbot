import { useState } from 'react';
import { WinnerBanner } from '../../components/game/WinnerBanner';

type CheckoutMode = 'SINGLE_OUT' | 'DOUBLE_OUT' | 'MASTER_OUT';

/** Entry flow for configuring game mode, checkout constraints, and match format. */
export function NewGamePage() {
  const [mode, setMode] = useState<'X01_301' | 'X01_501' | 'CRICKET' | 'CUSTOM'>('X01_501');
  const [legsPerSet, setLegsPerSet] = useState(3);
  const [setsToWin, setSetsToWin] = useState(2);
  const [playerOneCheckout, setPlayerOneCheckout] = useState<CheckoutMode>('DOUBLE_OUT');
  const [playerTwoCheckout, setPlayerTwoCheckout] = useState<CheckoutMode>('DOUBLE_OUT');

  return (
    <section className="space-y-3">
      <WinnerBanner text="Configure your next H-Town match" />

      <div className="rounded-2xl bg-panel p-4 space-y-3">
        <h2 className="text-sm font-semibold text-slate-200">Game Mode</h2>
        <div className="grid grid-cols-2 gap-2">
          {['X01_301', 'X01_501', 'CRICKET', 'CUSTOM'].map((entry) => (
            <button
              key={entry}
              onClick={() => setMode(entry as typeof mode)}
              className={`rounded-xl p-2 text-sm ${mode === entry ? 'bg-accent text-slate-900 font-semibold' : 'bg-slate-800 text-slate-200'}`}
            >
              {entry.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-panel p-4 space-y-3">
        <h2 className="text-sm font-semibold text-slate-200">Match Configuration</h2>
        <label className="block text-xs text-slate-400">Legs per Set: {legsPerSet}</label>
        <input type="range" min={1} max={7} value={legsPerSet} onChange={(e) => setLegsPerSet(Number(e.target.value))} className="w-full" />

        <label className="block text-xs text-slate-400">Sets to Win: {setsToWin}</label>
        <input type="range" min={1} max={5} value={setsToWin} onChange={(e) => setSetsToWin(Number(e.target.value))} className="w-full" />
      </div>

      <div className="rounded-2xl bg-panel p-4 space-y-3">
        <h2 className="text-sm font-semibold text-slate-200">Per-Player Checkout</h2>
        <CheckoutSelector label="Player One" value={playerOneCheckout} onChange={setPlayerOneCheckout} />
        <CheckoutSelector label="Player Two" value={playerTwoCheckout} onChange={setPlayerTwoCheckout} />
      </div>

      <button className="w-full rounded-xl bg-accent p-3 text-slate-900 font-semibold">Create Match</button>
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
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <div className="grid grid-cols-3 gap-2">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => onChange(option)}
            className={`rounded-lg p-2 text-xs ${value === option ? 'bg-accent text-slate-900 font-semibold' : 'bg-slate-800 text-slate-200'}`}
          >
            {option.replace('_', ' ')}
          </button>
        ))}
      </div>
    </div>
  );
}
