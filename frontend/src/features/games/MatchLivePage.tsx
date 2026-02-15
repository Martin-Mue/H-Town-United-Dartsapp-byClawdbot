import { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, CameraOff } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { GameApiClient, type MatchStateDto } from '../../services/GameApiClient';

const apiClient = new GameApiClient('http://localhost:8080');
const CRICKET_TARGETS: Array<15 | 16 | 17 | 18 | 19 | 20 | 25> = [20, 19, 18, 17, 16, 15, 25];

export function MatchLivePage() {
  const navigate = useNavigate();
  const { matchId = '' } = useParams();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [state, setState] = useState<MatchStateDto | null>(null);
  const [multiplier, setMultiplier] = useState<1 | 2 | 3>(1);
  const [selected, setSelected] = useState<number>(20);
  const [cricketTarget, setCricketTarget] = useState<15 | 16 | 17 | 18 | 19 | 20 | 25>(20);
  const [submitting, setSubmitting] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraHint, setCameraHint] = useState<string | null>(null);

  useEffect(() => {
    if (!matchId) return;
    apiClient.getMatch(matchId).then(setState).catch(() => undefined);
  }, [matchId]);

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
      setCameraHint('Kamera aktiv (Beta): visuelle Assistenz vorbereitet, Auto-Scoring folgt als nächster Schritt.');
      setCameraOn(true);
    } catch {
      setCameraHint('Kamera konnte nicht gestartet werden. Browser-Berechtigung prüfen.');
    }
  };

  const submit = async () => {
    if (!state) return;
    setSubmitting(true);
    try {
      const next = isCricket
        ? await apiClient.registerCricketTurn(state.matchId, { targetNumber: cricketTarget, multiplier })
        : await apiClient.registerTurn(state.matchId, {
            points: Math.min(60, selected === 50 ? 50 : selected * multiplier),
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

      <p className="primary-text text-sm font-semibold">{active?.displayName} wirft</p>

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
          <div className="grid grid-cols-4 gap-2">
            {CRICKET_TARGETS.map((n) => (
              <button key={n} onClick={() => setCricketTarget(n)} className={`rounded-lg p-2 text-sm ${cricketTarget === n ? 'bg-sky-400 text-slate-900 font-semibold' : 'bg-slate-800'}`}>
                {n === 25 ? 'Bull' : n}
              </button>
            ))}
          </div>
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
          </>
        )}

        <p className="text-center text-4xl font-bold primary-text">
          {isCricket ? `${cricketTarget === 25 ? 'Bull' : cricketTarget} x${multiplier}` : `${Math.min(60, selected === 50 ? 50 : selected * multiplier)} Punkte`}
        </p>

        <button onClick={submit} disabled={submitting} className="w-full rounded-xl bg-sky-400 p-3 text-slate-900 font-semibold">
          {submitting ? 'Speichern…' : 'WURF EINTRAGEN'}
        </button>
      </div>
    </section>
  );
}
