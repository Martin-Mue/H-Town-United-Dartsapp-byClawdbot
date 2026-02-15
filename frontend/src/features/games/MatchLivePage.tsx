import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { GameApiClient, type MatchStateDto } from '../../services/GameApiClient';

const apiClient = new GameApiClient('http://localhost:8080');

export function MatchLivePage() {
  const navigate = useNavigate();
  const { matchId = '' } = useParams();
  const [state, setState] = useState<MatchStateDto | null>(null);
  const [multiplier, setMultiplier] = useState<1 | 2 | 3>(1);
  const [selected, setSelected] = useState<number>(20);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!matchId) return;
    apiClient.getMatch(matchId).then(setState).catch(() => undefined);
  }, [matchId]);

  const active = useMemo(() => state?.players.find((p) => p.playerId === state.activePlayerId), [state]);

  const submit = async () => {
    if (!state) return;
    setSubmitting(true);
    try {
      const next = await apiClient.registerTurn(state.matchId, {
        points: Math.min(60, selected * multiplier),
        finalDartMultiplier: multiplier,
      });
      setState(next);
      if (next.winnerPlayerId) navigate('/match-summary');
    } finally {
      setSubmitting(false);
    }
  };

  if (!state) return <p className="card-bg rounded-xl p-4">Loading…</p>;

  return (
    <section className="min-h-[70vh] flex flex-col items-center justify-start gap-4">
      <div className="w-full max-w-xl grid grid-cols-2 gap-3">
        {state.players.map((p) => {
          const activePlayer = p.playerId === state.activePlayerId;
          return (
            <div key={p.playerId} className={`rounded-xl border p-4 text-center ${activePlayer ? 'border-sky-400 glow-cyan' : 'soft-border card-bg'}`}>
              <p className="font-semibold">{p.displayName}</p>
              <p className="text-5xl font-bold leading-none mt-1">{p.score}</p>
              <p className="text-xs muted-text mt-1">Ø {p.average}</p>
            </div>
          );
        })}
      </div>

      <p className="primary-text text-sm font-semibold">{active?.displayName} wirft</p>

      <div className="w-full max-w-xl rounded-2xl border soft-border card-bg p-4 space-y-3">
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((v) => (
            <button key={v} onClick={() => setMultiplier(v as 1 | 2 | 3)} className={`rounded-lg p-2 text-sm ${multiplier === v ? 'bg-sky-400 text-slate-900 font-semibold' : 'bg-slate-800'}`}>
              {v === 1 ? 'Single' : v === 2 ? 'Double' : 'Triple'}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
            <button key={n} onClick={() => setSelected(n)} className={`rounded-lg p-2 text-sm ${selected === n ? 'bg-sky-400 text-slate-900 font-semibold' : 'bg-slate-800'}`}>
              {n}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button onClick={() => setSelected(0)} className="rounded-lg bg-slate-800 p-2 text-xs">Miss</button>
          <button onClick={() => setSelected(25)} className="rounded-lg bg-slate-800 p-2 text-xs">Bull</button>
          <button onClick={() => setSelected(50)} className="rounded-lg bg-slate-800 p-2 text-xs">Bullseye</button>
        </div>

        <p className="text-center text-4xl font-bold primary-text">{Math.min(60, selected * multiplier)} <span className="text-base app-text">Punkte</span></p>
        <button onClick={submit} disabled={submitting} className="w-full rounded-xl bg-sky-400 p-3 text-slate-900 font-semibold">{submitting ? 'Speichern…' : 'WURF EINTRAGEN'}</button>
      </div>
    </section>
  );
}
