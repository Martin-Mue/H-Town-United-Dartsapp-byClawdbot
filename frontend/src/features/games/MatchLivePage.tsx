import { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, CameraOff } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { GameApiClient, type MatchStateDto } from '../../services/GameApiClient';
import { TournamentApiClient } from '../../services/TournamentApiClient';

const apiClient = new GameApiClient('http://localhost:8080');
const tournamentApiClient = new TournamentApiClient('http://localhost:8080');
const CRICKET_TARGETS: Array<15 | 16 | 17 | 18 | 19 | 20 | 25> = [20, 19, 18, 17, 16, 15, 25];
const MATCH_HISTORY_KEY = 'htown-match-history';

type HistoryEntry = {
  id: string;
  playedAt: string;
  mode: string;
  players: Array<{ id: string; name: string }>;
  winnerPlayerId: string | null;
  winnerName: string | null;
  resultLabel: string;
};

type ManagedPlayer = {
  id: string;
  displayName: string;
  currentAverage?: number;
  checkoutPercentage?: number;
  pressurePerformanceIndex?: number;
};

export function MatchLivePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { matchId = '' } = useParams();
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [state, setState] = useState<MatchStateDto | null>(null);
  const [multiplier, setMultiplier] = useState<1 | 2 | 3>(1);
  const [selected, setSelected] = useState<number>(20);
  const [cricketTarget, setCricketTarget] = useState<15 | 16 | 17 | 18 | 19 | 20 | 25>(20);
  const [pendingX01, setPendingX01] = useState<Array<{ points: number; multiplier: 1 | 2 | 3; label: string }>>([]);
  const [pendingCricket, setPendingCricket] = useState<Array<{ targetNumber: 15 | 16 | 17 | 18 | 19 | 20 | 25; multiplier: 1 | 2 | 3 }>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraHint, setCameraHint] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [turnCounter, setTurnCounter] = useState(0);
  const [dartCounter, setDartCounter] = useState(0);
  const [matchSettings, setMatchSettings] = useState<{ bullOffEnabled?: boolean; bullOffLimitType?: 'turns' | 'darts'; bullOffLimitValue?: number }>({});
  const [preMatchSeen, setPreMatchSeen] = useState(false);

  const query = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const tournamentId = query.get('tournamentId');
  const round = query.get('round');
  const fixture = query.get('fixture');

  useEffect(() => {
    if (!matchId) return;
    apiClient.getMatch(matchId).then(setState).catch(() => setErrorMessage('Match konnte nicht geladen werden.'));
  }, [matchId]);


  useEffect(() => {
    if (!matchId) return;
    try {
      const raw = window.localStorage.getItem(`htown-match-settings-${matchId}`);
      setMatchSettings(raw ? JSON.parse(raw) : {});
    } catch {
      setMatchSettings({});
    }
  }, [matchId]);


  const localPlayers = useMemo<ManagedPlayer[]>(() => {
    try {
      const raw = window.localStorage.getItem('htown-players');
      return raw ? (JSON.parse(raw) as ManagedPlayer[]) : [];
    } catch {
      return [];
    }
  }, []);

  const history = useMemo<HistoryEntry[]>(() => {
    try {
      const raw = window.localStorage.getItem(MATCH_HISTORY_KEY);
      return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
    } catch {
      return [];
    }
  }, []);

  const preMatchInsights = useMemo(() => {
    if (!state) return null;
    const players = state.players;
    const a = players[0];
    const b = players[1];

    const headToHead = a && b
      ? history.filter((m) => {
          const ids = m.players.map((p) => p.id);
          const names = m.players.map((p) => p.name.toLowerCase());
          const hasA = ids.includes(a.playerId) || names.includes(a.displayName.toLowerCase());
          const hasB = ids.includes(b.playerId) || names.includes(b.displayName.toLowerCase());
          return hasA && hasB;
        })
      : [];

    const winsA = a ? headToHead.filter((m) => m.winnerPlayerId === a.playerId || (m.winnerName ?? '').toLowerCase() === a.displayName.toLowerCase()).length : 0;
    const winsB = b ? headToHead.filter((m) => m.winnerPlayerId === b.playerId || (m.winnerName ?? '').toLowerCase() === b.displayName.toLowerCase()).length : 0;

    const tips = players.map((p) => {
      const profile = localPlayers.find((lp) => lp.id === p.playerId || lp.displayName.toLowerCase() === p.displayName.toLowerCase());
      const avg = profile?.currentAverage ?? p.average;
      const checkout = profile?.checkoutPercentage ?? p.checkoutPercentage;
      const pressure = profile?.pressurePerformanceIndex ?? 50;

      const tipList: string[] = [];
      if (avg >= 65) tipList.push('Früh Druck aufbauen: erste 2 Darts auf Scoring-Feld priorisieren.');
      else tipList.push('Konstante Single-Visits sichern, keine erzwungenen Triple-Risiken in Dart 3.');

      if (checkout >= 35) tipList.push('Checkout-Wege aggressiv callen (2-Dart-Finish früh vorbereiten).');
      else tipList.push('Checkout über Lieblingsdoppel vorbereiten (z. B. D16/D20 Route).');

      if (pressure >= 70) tipList.push('In engen Legs Tempo kontrollieren und Gegner auf Decider zwingen.');
      else tipList.push('Bei Rest <100 bewusst auf sichere Setups statt Hero-Shots gehen.');

      return { playerId: p.playerId, displayName: p.displayName, tipList };
    });

    return { headToHeadMatches: headToHead.length, winsA, winsB, tips };
  }, [state, history, localPlayers]);

  const isCricket = state?.mode === 'CRICKET';
  const active = useMemo(() => state?.players.find((p) => p.playerId === state.activePlayerId), [state]);

  const toggleCamera = async () => {
    if (cameraOn) {
      const stream = videoRef.current?.srcObject as MediaStream | null;
      stream?.getTracks().forEach((t) => t.stop());
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
      setCameraHint('Kamera aktiv (Beta): Score-Vorschlag folgt im nächsten CV-Schritt.');
      setCameraOn(true);
    } catch {
      setCameraHint('Kamera konnte nicht gestartet werden. Browser-Berechtigung prüfen.');
    }
  };

  const addDartToTurn = () => {
    if (pendingX01.length >= 3) return;
    const points = Math.min(60, selected === 50 ? 50 : selected * multiplier);
    const label = selected === 0 ? 'Miss' : selected === 25 ? `Bull x${multiplier}` : selected === 50 ? 'Bullseye' : `${selected} x${multiplier}`;
    setPendingX01((prev) => [...prev, { points, multiplier, label }]);
    setErrorMessage(null);
  };

  const addCricketThrowToTurn = () => {
    if (pendingCricket.length >= 3) return;
    setPendingCricket((prev) => [...prev, { targetNumber: cricketTarget, multiplier }]);
    setErrorMessage(null);
  };

  const clearTurn = () => {
    setPendingX01([]);
    setPendingCricket([]);
  };

  const saveHistory = (next: MatchStateDto) => {
    if (!next.winnerPlayerId) return;
    const winner = next.players.find((p) => p.playerId === next.winnerPlayerId);
    const winnerScore = next.scoreboard.find((s) => s.playerId === next.winnerPlayerId);
    const loserScore = next.scoreboard.find((s) => s.playerId !== next.winnerPlayerId);
    const resultLabel = winnerScore && loserScore
      ? `${winnerScore.sets}:${loserScore.sets} Sets · ${winnerScore.legs}:${loserScore.legs} Legs`
      : 'Match abgeschlossen';

    const entry: HistoryEntry = {
      id: next.matchId,
      playedAt: new Date().toISOString(),
      mode: next.mode,
      players: next.players.map((p) => ({ id: p.playerId, name: p.displayName })),
      winnerPlayerId: next.winnerPlayerId,
      winnerName: winner?.displayName ?? null,
      resultLabel,
    };

    try {
      const raw = window.localStorage.getItem(MATCH_HISTORY_KEY);
      const existing = raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
      const dedup = existing.filter((item) => item.id !== entry.id);
      window.localStorage.setItem(MATCH_HISTORY_KEY, JSON.stringify([entry, ...dedup]));
    } catch {
      // ignore storage errors
    }
  };

  const syncTournamentResultIfNeeded = async (next: MatchStateDto) => {
    if (!next.winnerPlayerId || !tournamentId || !round || !fixture) return;
    const winner = next.players.find((p) => p.playerId === next.winnerPlayerId);
    const winnerScore = next.scoreboard.find((s) => s.playerId === next.winnerPlayerId);
    const loserScore = next.scoreboard.find((s) => s.playerId !== next.winnerPlayerId);
    const resultLabel = winnerScore && loserScore
      ? `${winner?.displayName ?? 'Winner'} (${winnerScore.sets}:${loserScore.sets})`
      : `${winner?.displayName ?? 'Winner'} gewinnt`;

    await tournamentApiClient.recordWinner(
      tournamentId,
      Number(round),
      Number(fixture),
      winner?.displayName ?? next.winnerPlayerId,
      resultLabel,
    );
  };

  const submitTurn = async () => {
    if (!state) return;
    if (bullOffRequired) { setErrorMessage('Ausbullen erforderlich. Bitte Sieger per Bull-Off festlegen.'); return; }
    setSubmitting(true);
    setErrorMessage(null);

    try {
      let nextState = state;

      if (isCricket) {
        if (pendingCricket.length === 0) {
          setErrorMessage('Bitte bis zu 3 Darts hinzufügen.');
          return;
        }

        for (const throwItem of pendingCricket) {
          nextState = await apiClient.registerCricketTurn(nextState.matchId, throwItem);
          if (nextState.winnerPlayerId) break;
        }
      } else {
        if (pendingX01.length === 0) {
          setErrorMessage('Bitte bis zu 3 Darts hinzufügen.');
          return;
        }

        const totalPoints = pendingX01.reduce((sum, dart) => sum + dart.points, 0);
        const finalDartMultiplier = pendingX01[pendingX01.length - 1]?.multiplier ?? 1;

        nextState = await apiClient.registerTurn(nextState.matchId, {
          points: totalPoints,
          finalDartMultiplier,
        });
      }

      setState(nextState);
      setTurnCounter((t) => t + 1);
      setDartCounter((d) => d + (isCricket ? pendingCricket.length : pendingX01.length));
      clearTurn();

      if (nextState.winnerPlayerId) {
        saveHistory(nextState);
        await syncTournamentResultIfNeeded(nextState);
        navigate(tournamentId ? '/tournaments' : '/match-summary');
      }
    } finally {
      setSubmitting(false);
    }
  };


  const bullOffRequired = Boolean(
    !state?.winnerPlayerId &&
    matchSettings.bullOffEnabled &&
    ((matchSettings.bullOffLimitType === 'turns' && turnCounter >= (matchSettings.bullOffLimitValue ?? 0)) ||
      (matchSettings.bullOffLimitType === 'darts' && dartCounter >= (matchSettings.bullOffLimitValue ?? 0))),
  );

  const resolveBullOff = async (winnerPlayerId: string) => {
    if (!state) return;
    const next = await apiClient.registerBullOffWinner(state.matchId, { winnerPlayerId });
    setState(next);
    saveHistory(next);
    await syncTournamentResultIfNeeded(next);
    navigate(tournamentId ? '/tournaments' : '/match-summary');
  };


  if (!state) return <p className="card-bg rounded-xl p-4">Loading…</p>;

  if (!preMatchSeen) {
    return (
      <section className="space-y-4 animate-[fadeIn_.25s_ease]">
        <div className="hero-gradient rounded-2xl border soft-border p-4">
          <p className="text-xs muted-text">Matchup Preview</p>
          <h2 className="text-xl uppercase">{state.players.map((p) => p.displayName).join(' vs ')}</h2>
          <p className="text-xs muted-text mt-1">{state.mode.replace('_', ' ')} · Vor dem Anwurf</p>
        </div>

        {preMatchInsights && state.players.length >= 2 && (
          <div className="rounded-2xl card-bg border soft-border p-4">
            <h3 className="text-sm uppercase mb-2">Direktvergleich</h3>
            <p className="text-xs">Bisherige Duelle: <span className="primary-text font-semibold">{preMatchInsights.headToHeadMatches}</span></p>
            <p className="text-xs mt-1">Bilanz: <span className="font-semibold">{state.players[0].displayName} {preMatchInsights.winsA}</span> : <span className="font-semibold">{preMatchInsights.winsB} {state.players[1].displayName}</span></p>
          </div>
        )}

        <div className="space-y-3">
          {preMatchInsights?.tips.map((entry) => (
            <article key={entry.playerId} className="rounded-2xl card-bg border soft-border p-4">
              <h4 className="text-sm uppercase mb-2">Gameplan · {entry.displayName}</h4>
              <ul className="space-y-1 text-xs list-disc pl-4">
                {entry.tipList.map((tip) => <li key={tip}>{tip}</li>)}
              </ul>
            </article>
          ))}
        </div>

        <button onClick={() => setPreMatchSeen(true)} className="w-full rounded-xl bg-sky-400 p-3 font-semibold text-slate-900">Match starten</button>
      </section>
    );
  }

  return (
    <section className="min-h-[70vh] flex flex-col items-center gap-4">
      <div className="w-full max-w-xl grid grid-cols-2 gap-3">
        {state.players.map((p) => {
          const activePlayer = p.playerId === state.activePlayerId;
          return (
            <div key={p.playerId} className={`rounded-xl border p-4 text-center ${activePlayer ? 'border-sky-400 glow-cyan' : 'soft-border card-bg'}`}>
              <p className="font-semibold">{p.displayName}</p>
              <p className="text-5xl font-bold leading-none mt-1">{isCricket ? p.cricketScore : p.score}</p>
              <p className="text-xs muted-text mt-1">Ø {p.average}</p>
            </div>
          );
        })}
      </div>

      <p className="primary-text text-sm font-semibold">{active?.displayName} wirft (3 Darts)</p>

      <div className="w-full max-w-xl rounded-2xl border soft-border card-bg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm uppercase">Wurf Eingabe</h3>
          <button onClick={toggleCamera} className="rounded-lg bg-slate-800 px-2 py-1 text-xs flex items-center gap-1">
            {cameraOn ? <CameraOff size={14} /> : <Camera size={14} />} {cameraOn ? 'Kamera aus' : 'Kamera'}
          </button>
        </div>

        {cameraOn && <video ref={videoRef} className="w-full rounded-xl border soft-border bg-black" muted playsInline />}
        {cameraHint && <p className="text-[11px] muted-text">{cameraHint}</p>}

        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((v) => (
            <button key={v} onClick={() => setMultiplier(v as 1 | 2 | 3)} className={`rounded-lg p-2 text-sm ${multiplier === v ? 'bg-sky-400 text-slate-900 font-semibold' : 'bg-slate-800'}`}>
              {v === 1 ? 'Single' : v === 2 ? 'Double' : 'Triple'}
            </button>
          ))}
        </div>

        {isCricket ? (
          <>
            <div className="grid grid-cols-4 gap-2">
              {CRICKET_TARGETS.map((n) => (
                <button key={n} onClick={() => setCricketTarget(n)} className={`rounded-lg p-2 text-sm ${cricketTarget === n ? 'bg-sky-400 text-slate-900 font-semibold' : 'bg-slate-800'}`}>
                  {n === 25 ? 'Bull' : n}
                </button>
              ))}
            </div>
            <button onClick={addCricketThrowToTurn} disabled={pendingCricket.length >= 3} className="w-full rounded-lg bg-slate-800 p-2 text-xs">Dart hinzufügen ({pendingCricket.length}/3)</button>
            <p className="text-xs muted-text">Turn: {pendingCricket.map((d, i) => `#${i + 1} ${d.targetNumber === 25 ? 'Bull' : d.targetNumber}x${d.multiplier}`).join(' · ') || '—'}</p>
          </>
        ) : (
          <>
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
            <button onClick={addDartToTurn} disabled={pendingX01.length >= 3} className="w-full rounded-lg bg-slate-800 p-2 text-xs">Dart hinzufügen ({pendingX01.length}/3)</button>
            <p className="text-xs muted-text">Turn: {pendingX01.map((d, i) => `#${i + 1} ${d.label}=${d.points}`).join(' · ') || '—'}</p>
          </>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button onClick={clearTurn} className="rounded-xl bg-slate-700 p-2 text-sm">Turn löschen</button>
          <button onClick={submitTurn} disabled={submitting} className="rounded-xl bg-sky-400 p-2 text-slate-900 font-semibold">
            {submitting ? 'Speichern…' : '3-Dart Turn eintragen'}
          </button>
        </div>

        {bullOffRequired && (
          <div className="rounded-lg border border-amber-400/40 bg-amber-900/20 p-3 space-y-2">
            <p className="text-xs text-amber-100">Limit erreicht ({matchSettings.bullOffLimitType === 'turns' ? `${turnCounter} Runden` : `${dartCounter} Darts`}). Bitte Ausbullen-Sieger wählen.</p>
            <div className="grid grid-cols-2 gap-2">
              {state.players.map((p) => (
                <button key={p.playerId} onClick={() => void resolveBullOff(p.playerId)} className="rounded bg-amber-300 p-2 text-xs font-semibold text-slate-900">
                  {p.displayName} gewinnt Ausbullen
                </button>
              ))}
            </div>
          </div>
        )}

        {errorMessage && <p className="rounded bg-red-900/40 p-2 text-xs text-red-100">{errorMessage}</p>}
      </div>
    </section>
  );
}
