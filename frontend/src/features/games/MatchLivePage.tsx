import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { GameApiClient, type MatchStateDto } from '../../services/GameApiClient';

const apiClient = new GameApiClient('http://localhost:8080');

/** Live match scoring screen connected to backend match APIs. */
export function MatchLivePage() {
  const navigate = useNavigate();
  const { matchId = '' } = useParams();

  const [state, setState] = useState<MatchStateDto | null>(null);
  const [pointsInput, setPointsInput] = useState('60');
  const [multiplier, setMultiplier] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!matchId) return;
    apiClient
      .getMatch(matchId)
      .then(setState)
      .catch(() => setErrorMessage('Unable to load match. Is backend running?'));
  }, [matchId]);

  const activePlayer = useMemo(
    () => state?.players.find((player) => player.playerId === state.activePlayerId) ?? null,
    [state],
  );

  const submitTurn = async () => {
    if (!state) return;
    const points = Number(pointsInput);
    if (!Number.isInteger(points) || points < 0 || points > 180) {
      setErrorMessage('Please enter valid points between 0 and 180.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      const nextState = await apiClient.registerTurn(state.matchId, {
        points,
        finalDartMultiplier: multiplier,
      });
      setState(nextState);

      if (nextState.winnerPlayerId) {
        window.localStorage.removeItem('htown-active-match-id');
        navigate('/match-summary');
      }
    } catch {
      setErrorMessage('Turn submission failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!state) {
    return <p className="rounded-xl card-bg p-4 text-sm">Loading live match…</p>;
  }

  return (
    <section className="space-y-3">
      <div className="rounded-2xl card-bg p-4">
        <h2 className="text-base font-semibold">Live Match</h2>
        <p className="text-xs muted-text mt-1">Match ID: {state.matchId}</p>
        <p className="text-sm mt-2">Active Player: <span className="font-semibold text-sky-400">{activePlayer?.displayName}</span></p>
      </div>

      <div className="rounded-2xl card-bg p-4 space-y-2">
        {state.players.map((player) => {
          const score = state.scoreboard.find((entry) => entry.playerId === player.playerId);
          const isActive = state.activePlayerId === player.playerId;

          return (
            <div key={player.playerId} className={`rounded-xl p-3 ${isActive ? 'bg-sky-900/40 border border-sky-400/40' : 'bg-slate-800'}`}>
              <div className="flex items-center justify-between">
                <p className="font-semibold">{player.displayName}</p>
                <p className="text-xl font-bold">{player.score}</p>
              </div>
              <p className="text-xs muted-text mt-1">
                Avg {player.average} · Checkout {player.checkoutPercentage}% · Legs {score?.legs ?? 0} · Sets {score?.sets ?? 0}
              </p>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl card-bg p-4 space-y-3">
        <h3 className="text-sm font-semibold">Register Turn</h3>
        <input
          value={pointsInput}
          onChange={(event) => setPointsInput(event.target.value)}
          type="number"
          min={0}
          max={180}
          className="w-full rounded-xl bg-slate-800 p-2 text-sm"
        />

        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((entry) => (
            <button
              key={entry}
              onClick={() => setMultiplier(entry as 1 | 2 | 3)}
              className={`rounded-lg p-2 text-sm ${multiplier === entry ? 'bg-sky-400 text-slate-900 font-semibold' : 'bg-slate-800'}`}
            >
              x{entry}
            </button>
          ))}
        </div>

        <button onClick={submitTurn} disabled={isSubmitting} className="w-full rounded-xl bg-sky-400 p-3 font-semibold text-slate-900 disabled:opacity-60">
          {isSubmitting ? 'Submitting…' : 'Submit Turn'}
        </button>

        {errorMessage && <p className="rounded-xl bg-red-900/40 p-3 text-sm text-red-100">{errorMessage}</p>}
      </div>
    </section>
  );
}
