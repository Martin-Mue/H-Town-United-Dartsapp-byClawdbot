import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { GameApiClient, type MatchStateDto } from '../../services/GameApiClient';

const apiClient = new GameApiClient('http://localhost:8080');
const CRICKET_TARGETS: Array<15 | 16 | 17 | 18 | 19 | 20 | 25> = [20, 19, 18, 17, 16, 15, 25];
const QUICK_SEGMENTS = [
  { label: 'T20', value: 60 },
  { label: 'T19', value: 57 },
  { label: 'T18', value: 54 },
  { label: 'D20', value: 40 },
  { label: 'D16', value: 32 },
  { label: 'BULL', value: 50 },
];

/** Live match scoring screen connected to backend match APIs with darts-first UX. */
export function MatchLivePage() {
  const navigate = useNavigate();
  const { matchId = '' } = useParams();

  const [state, setState] = useState<MatchStateDto | null>(null);
  const [multiplier, setMultiplier] = useState<1 | 2 | 3>(1);
  const [cricketTarget, setCricketTarget] = useState<15 | 16 | 17 | 18 | 19 | 20 | 25>(20);
  const [dartInput, setDartInput] = useState('20');
  const [turnDarts, setTurnDarts] = useState<number[]>([]);
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

  const isCricket = state?.mode === 'CRICKET';
  const turnTotal = turnDarts.reduce((acc, value) => acc + value, 0);

  const addDart = (base?: number) => {
    if (turnDarts.length >= 3) return;
    const baseValue = base ?? Number(dartInput);
    if (!Number.isInteger(baseValue) || baseValue < 0 || baseValue > 20) {
      setErrorMessage('Enter a valid segment number between 0 and 20.');
      return;
    }
    const score = Math.min(60, baseValue * multiplier);
    setErrorMessage(null);
    setTurnDarts((prev) => [...prev, score]);
  };

  const addDirectScore = (score: number) => {
    if (turnDarts.length >= 3) return;
    setErrorMessage(null);
    setTurnDarts((prev) => [...prev, score]);
  };

  const clearTurn = () => setTurnDarts([]);

  const submitX01Turn = async () => {
    if (!state) return;
    if (turnDarts.length === 0) {
      setErrorMessage('Add at least one dart before submitting turn.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      const nextState = await apiClient.registerTurn(state.matchId, {
        points: turnTotal,
        finalDartMultiplier: multiplier,
      });
      setState(nextState);
      setTurnDarts([]);
      handleWinner(nextState);
    } catch {
      setErrorMessage('Turn submission failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitCricketTurn = async () => {
    if (!state) return;

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      const nextState = await apiClient.registerCricketTurn(state.matchId, {
        targetNumber: cricketTarget,
        multiplier,
      });
      setState(nextState);
      handleWinner(nextState);
    } catch {
      setErrorMessage('Cricket throw submission failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWinner = (nextState: MatchStateDto) => {
    if (nextState.winnerPlayerId) {
      window.localStorage.removeItem('htown-active-match-id');
      navigate('/match-summary');
    }
  };

  if (!state) {
    return <p className="rounded-xl card-bg p-4 text-sm">Loading live match…</p>;
  }

  return (
    <section className="space-y-3">
      <article className="hero-gradient rounded-2xl border soft-border p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-lg uppercase">Match Control</h2>
            <p className="text-xs muted-text">Mode: {state.mode.replace('_', ' ')} · Match ID: {state.matchId.slice(0, 10)}</p>
          </div>
          <div className="rounded-lg bg-slate-800 px-2 py-1 text-xs">
            Am Zug: <span className="primary-text font-semibold">{activePlayer?.displayName}</span>
          </div>
        </div>
      </article>

      <div className="rounded-2xl card-bg p-4 space-y-2">
        {state.players.map((player) => {
          const score = state.scoreboard.find((entry) => entry.playerId === player.playerId);
          const isActive = state.activePlayerId === player.playerId;

          return (
            <div
              key={player.playerId}
              className={`rounded-xl p-3 ${isActive ? 'bg-sky-900/40 border border-sky-400/40' : 'bg-slate-800'}`}
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold">{player.displayName}</p>
                <p className="text-2xl font-bold">{isCricket ? player.cricketScore : player.score}</p>
              </div>

              {isCricket ? (
                <p className="text-xs muted-text mt-1">
                  20({player.cricketMarks.m20}) 19({player.cricketMarks.m19}) 18({player.cricketMarks.m18}) 17({player.cricketMarks.m17}) 16({player.cricketMarks.m16}) 15({player.cricketMarks.m15}) B({player.cricketMarks.bull})
                </p>
              ) : (
                <p className="text-xs muted-text mt-1">
                  Avg {player.average} · Checkout {player.checkoutPercentage}% · Legs {score?.legs ?? 0} · Sets {score?.sets ?? 0}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl card-bg p-4 space-y-3">
        <h3 className="text-sm font-semibold uppercase">Throw Entry</h3>

        {isCricket ? (
          <>
            <div className="grid grid-cols-4 gap-2">
              {CRICKET_TARGETS.map((target) => (
                <button
                  key={target}
                  onClick={() => setCricketTarget(target)}
                  className={`rounded-lg p-2 text-xs ${cricketTarget === target ? 'bg-sky-400 text-slate-900 font-semibold' : 'bg-slate-800'}`}
                >
                  {target === 25 ? 'BULL' : target}
                </button>
              ))}
            </div>

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

            <button
              onClick={submitCricketTurn}
              disabled={isSubmitting}
              className="w-full rounded-xl bg-sky-400 p-3 font-semibold text-slate-900 disabled:opacity-60"
            >
              {isSubmitting ? 'Submitting…' : `Submit Cricket Hit (${cricketTarget === 25 ? 'BULL' : cricketTarget} x${multiplier})`}
            </button>
          </>
        ) : (
          <>
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

            <div className="grid grid-cols-3 gap-2">
              {QUICK_SEGMENTS.map((segment) => (
                <button
                  key={segment.label}
                  onClick={() => addDirectScore(segment.value)}
                  className="rounded-lg bg-slate-800 p-2 text-xs"
                >
                  {segment.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
              <input
                value={dartInput}
                onChange={(event) => setDartInput(event.target.value)}
                type="number"
                min={0}
                max={20}
                className="w-full rounded-xl bg-slate-800 p-2 text-sm"
                placeholder="Segment number (0-20)"
              />
              <button onClick={() => addDart()} className="rounded-xl bg-slate-700 px-3 py-2 text-sm">
                Add Dart
              </button>
            </div>

            <div className="rounded-xl bg-slate-800 p-3 text-xs">
              <p>Darts: {turnDarts.length > 0 ? turnDarts.map((d, i) => `#${i + 1}:${d}`).join(' · ') : 'none yet'}</p>
              <p className="mt-1 font-semibold">Turn total: {turnTotal}</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button onClick={clearTurn} className="rounded-xl bg-slate-700 p-2 text-sm">Clear Turn</button>
              <button
                onClick={submitX01Turn}
                disabled={isSubmitting}
                className="rounded-xl bg-sky-400 p-2 text-sm font-semibold text-slate-900 disabled:opacity-60"
              >
                {isSubmitting ? 'Submitting…' : 'Confirm Turn'}
              </button>
            </div>
          </>
        )}

        {errorMessage && <p className="rounded-xl bg-red-900/40 p-3 text-sm text-red-100">{errorMessage}</p>}
      </div>
    </section>
  );
}
