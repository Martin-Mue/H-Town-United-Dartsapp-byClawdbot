import { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, CameraOff } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { GameApiClient, type MatchStateDto } from '../../services/GameApiClient';
import { TournamentApiClient } from '../../services/TournamentApiClient';
import { SocketIoLiveMatchClient } from '../../services/LiveMatchSocketClient';

import { getApiBaseUrl } from '../../services/apiBase';

const API_BASE = getApiBaseUrl();
const apiClient = new GameApiClient(API_BASE);
const tournamentApiClient = new TournamentApiClient(API_BASE);
const liveSocketClient = new SocketIoLiveMatchClient(API_BASE);
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
  playerTurnScores?: Record<string, number[]>;
  legResults?: Array<{ legNumber: number; winnerPlayerId: string; winnerDisplayName: string; setsAfterLeg: number; totalLegsWonAfterLeg: number; dartsUsedByWinner: number; turnsByWinner: number }>;
  playerMatchStats?: Array<{
    playerId: string;
    displayName: string;
    first9Average: number;
    matchAverage: number;
    checkoutAttempts: number;
    successfulCheckouts: number;
    bestLegDarts: number | null;
    worstLegDarts: number | null;
  }>;
  playerSegmentStats?: Record<string, { segments: Record<string, number>; doubles: Record<string, number> }>;
};

type ManagedPlayer = {
  id: string;
  displayName: string;
  nickname?: string;
  nicknamePronunciation?: string;
  announcerStyle?: 'ARENA' | 'CLASSIC' | 'HYPE' | 'COOL' | 'INTIMIDATOR';
  introAnnouncementEnabled?: boolean;
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
  const [pendingX01, setPendingX01] = useState<Array<{ points: number; multiplier: 1 | 2 | 3; label: string; segment: number }>>([]);
  const [pendingCricket, setPendingCricket] = useState<Array<{ targetNumber: 15 | 16 | 17 | 18 | 19 | 20 | 25; multiplier: 1 | 2 | 3 }>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraHint, setCameraHint] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [turnCounter, setTurnCounter] = useState(0);
  const [dartCounter, setDartCounter] = useState(0);
  const [matchSettings, setMatchSettings] = useState<{ bullOffEnabled?: boolean; bullOffLimitType?: 'turns' | 'darts'; bullOffLimitValue?: number }>({});
  const [preMatchSeen, setPreMatchSeen] = useState(false);
  const [playerTurnScores, setPlayerTurnScores] = useState<Record<string, number[]>>({});
  const [playerSegmentStats, setPlayerSegmentStats] = useState<Record<string, { segments: Record<string, number>; doubles: Record<string, number> }>>({});
  const [cameraDetection, setCameraDetection] = useState<{ turnId: string; points: number; multiplier: 1 | 2 | 3; confidence: number; requiresManualReview: boolean } | null>(null);
  const [cameraReviewDraft, setCameraReviewDraft] = useState<{ turnId: string; points: number; multiplier: 1 | 2 | 3; confidence: number } | null>(null);
  const [quickEntryMode, setQuickEntryMode] = useState(false);
  const [quickTurnPoints, setQuickTurnPoints] = useState('');
  const [quickFinalMultiplier, setQuickFinalMultiplier] = useState<1 | 2 | 3>(2);
  const [legStarterPlayerId, setLegStarterPlayerId] = useState<string | null>(null);
  const [lastLegSnapshot, setLastLegSnapshot] = useState('');
  const [showPreMatchTips, setShowPreMatchTips] = useState(false);
  const [cameraStatus, setCameraStatus] = useState<'disconnected' | 'connected' | 'calibrating' | 'detecting' | 'waiting_for_pull'>('disconnected');
  const [isMatchPaused, setIsMatchPaused] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const [remoteStatus, setRemoteStatus] = useState<'idle' | 'connecting' | 'connected' | 'failed'>('idle');
  const lastBoardStateRef = useRef<'DARTS_PRESENT' | 'DARTS_CLEARED' | null>(null);
  const [autoVisitLoopEnabled, setAutoVisitLoopEnabled] = useState(false);
  const [calibrationQuality, setCalibrationQuality] = useState<string | null>(null);
  const [lastDetectedVisit, setLastDetectedVisit] = useState<Array<{ points: number; multiplier: 1 | 2 | 3; targetNumber?: 15 | 16 | 17 | 18 | 19 | 20 | 25 }> | null>(null);
  const [autoLoopFailures, setAutoLoopFailures] = useState(0);

  const query = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const tournamentId = query.get('tournamentId');
  const round = query.get('round');
  const fixture = query.get('fixture');
  const cameraAutoEnabled = query.get('camera') === '1';

  useEffect(() => {
    if (!matchId) return;
    window.localStorage.setItem('htown-active-match-id', matchId);
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

  useEffect(() => {
    if (!matchId) return;
    const raw = window.localStorage.getItem(`htown-match-paused-${matchId}`);
    setIsMatchPaused(raw === '1');
  }, [matchId]);




  useEffect(() => {
    if (!matchId) return;
    let mounted = true;

    const initPeer = async () => {
      const pc = new RTCPeerConnection();
      peerConnectionRef.current = pc;
      pc.ontrack = (event) => {
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
          setRemoteStatus('connected');
        }
      };
      pc.onicecandidate = (event) => {
        if (event.candidate) liveSocketClient.sendWebRtcSignal(matchId, { candidate: event.candidate });
      };

      liveSocketClient.onWebRtcSignal(async ({ signal }) => {
        const payload = signal as { offer?: RTCSessionDescriptionInit; answer?: RTCSessionDescriptionInit; candidate?: RTCIceCandidateInit };
        try {
          if (payload.offer) {
            setRemoteStatus('connecting');
            await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            liveSocketClient.sendWebRtcSignal(matchId, { answer });
          } else if (payload.answer) {
            await pc.setRemoteDescription(new RTCSessionDescription(payload.answer));
            setRemoteStatus('connected');
          } else if (payload.candidate) {
            await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
          }
        } catch {
          setRemoteStatus('failed');
        }
      });

      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      }
    };

    void liveSocketClient.connect().then(() => {
      if (!mounted) return;
      liveSocketClient.subscribeToMatch(matchId);
      liveSocketClient.joinCameraRoom(matchId);
      void initPeer();
      setCameraStatus((prev) => (prev === 'disconnected' ? 'connected' : prev));
    });

    return () => {
      mounted = false;
      peerConnectionRef.current?.close();
      peerConnectionRef.current = null;
      liveSocketClient.disconnect();
    };
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


  useEffect(() => {
    if (!state || preMatchSeen || state.players.length === 0) return;
    const names = state.players
      .map((p) => {
        const local = localPlayers.find((lp) => lp.id === p.playerId || lp.displayName.toLowerCase() === p.displayName.toLowerCase());
        if (local && local.introAnnouncementEnabled === false) return null;
        const display = local?.nickname ? `${p.displayName} "${local.nicknamePronunciation || local.nickname}"` : p.displayName;
        return display;
      })
      .filter(Boolean)
      .join(' gegen ');

    if (!names || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const utterance = new SpeechSynthesisUtterance(`Matchup: ${names}`);
    utterance.rate = 0.95;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }, [state, preMatchSeen, localPlayers]);


  useEffect(() => {
    if (!cameraAutoEnabled || cameraOn) return;
    // Auto-attempt on match start; if blocked by browser policy, user can retry via button.
    void toggleCamera(true);
  }, [cameraAutoEnabled, cameraOn]);

  const isCricket = state?.mode === 'CRICKET';
  const active = useMemo(() => state?.players.find((p) => p.playerId === state.activePlayerId), [state]);

  const leadInfo = useMemo(() => {
    if (!state || state.players.length < 2) return null;
    const [a, b] = state.scoreboard;
    if (!a || !b) return null;

    const setLead = a.sets === b.sets ? 'Gleichstand' : a.sets > b.sets ? `${state.players.find((p) => p.playerId === a.playerId)?.displayName ?? 'Spieler 1'} führt in Sätzen` : `${state.players.find((p) => p.playerId === b.playerId)?.displayName ?? 'Spieler 2'} führt in Sätzen`;
    const legLead = a.legs === b.legs ? 'Legs ausgeglichen' : a.legs > b.legs ? `${state.players.find((p) => p.playerId === a.playerId)?.displayName ?? 'Spieler 1'} führt in Legs` : `${state.players.find((p) => p.playerId === b.playerId)?.displayName ?? 'Spieler 2'} führt in Legs`;
    return { setLead, legLead };
  }, [state]);

  const checkoutSuggestions = useMemo(() => {
    if (!active || isCricket) return [] as string[];
    const r = active.score;
    const table: Record<number, string[]> = {
      170: ['T20 T20 Bull'], 167: ['T20 T19 Bull'], 164: ['T20 T18 Bull'], 161: ['T20 T17 Bull'],
      160: ['T20 T20 D20'], 158: ['T20 T20 D19'], 157: ['T20 T19 D20'], 156: ['T20 T20 D18'],
      155: ['T20 T19 D19'], 154: ['T20 T18 D20'], 153: ['T20 T19 D18'], 152: ['T20 T20 D16'],
      151: ['T20 T17 D20'], 150: ['T20 T18 D18'], 149: ['T20 T19 D16'], 148: ['T20 T16 D20'],
      147: ['T20 T17 D18'], 146: ['T20 T18 D16'], 145: ['T20 T15 D20'], 144: ['T20 T20 D12'],
      143: ['T20 T17 D16'], 142: ['T20 T14 D20'], 141: ['T20 T19 D12'], 140: ['T20 T20 D10'],
      132: ['Bull Bull D16'], 121: ['T20 11 Bull'], 100: ['T20 D20'], 81: ['T19 D12'], 76: ['T20 D8'],
      70: ['T18 D8'], 68: ['T20 D4', 'S20 D24'], 64: ['T16 D8'], 60: ['20 D20'], 50: ['18 D16', '10 D20'],
      40: ['D20'], 32: ['D16'], 24: ['D12'], 16: ['D8'], 8: ['D4'],
    };
    if (table[r]) return table[r];
    if (r <= 40 && r % 2 === 0) return [`D${r / 2}`];
    if (r > 40 && r <= 170) return ['Setup auf Lieblingsdoppel spielen'];
    return [];
  }, [active, isCricket]);


  const quickTurnPresets = [26, 41, 45, 60, 81, 85, 95, 100, 121, 140, 180];

  const turnProjection = useMemo(() => {
    if (!state || isCricket || !active) return null;
    const turnPoints = quickEntryMode
      ? Math.max(0, Math.min(180, Number(quickTurnPoints || 0)))
      : pendingX01.reduce((sum, dart) => sum + dart.points, 0);

    const projected = active.score - turnPoints;
    const bust = projected < 0;
    return {
      turnPoints,
      projected,
      bust,
      checkoutNow: projected === 0,
    };
  }, [state, isCricket, active, quickEntryMode, quickTurnPoints, pendingX01]);

  useEffect(() => {
    if (!state) return;
    const snapshot = state.scoreboard.map((s) => `${s.playerId}:${s.legs}`).join('|');
    if (!legStarterPlayerId) setLegStarterPlayerId(state.activePlayerId);
    if (lastLegSnapshot && snapshot !== lastLegSnapshot) {
      setLegStarterPlayerId(state.activePlayerId);
    }
    setLastLegSnapshot(snapshot);
  }, [state, legStarterPlayerId, lastLegSnapshot]);

  const removePendingDart = (index: number) => {
    setPendingX01((prev) => prev.filter((_, i) => i !== index));
  };

  const replacePendingDart = (index: number) => {
    const points = Math.min(60, selected === 50 ? 50 : selected * multiplier);
    const label = selected === 0 ? 'Miss' : selected === 25 ? `Bull x${multiplier}` : selected === 50 ? 'Bullseye' : `${selected} x${multiplier}`;
    setPendingX01((prev) => prev.map((dart, i) => (i === index ? { points, multiplier, label, segment: selected } : dart)));
  };


  const toggleCamera = async (autoAttempt = false) => {
    if (cameraOn) {
      const stream = videoRef.current?.srcObject as MediaStream | null;
      stream?.getTracks().forEach((t) => t.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
      setCameraOn(false);
      setCameraStatus('disconnected');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.playsInline = true;
        videoRef.current.autoplay = true;
        try {
          await videoRef.current.play();
        } catch {
          // mobile browsers can block autoplay without direct gesture
        }
      }
      const pc = peerConnectionRef.current;
      if (pc) {
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          liveSocketClient.sendWebRtcSignal(matchId, { offer });
          setRemoteStatus('connecting');
        } catch {
          setRemoteStatus('failed');
        }
      }

      setCameraHint('Kamera aktiv: Live-Bild + KI-Erkennung bereit.');
      setCameraOn(true);
      setCameraStatus('calibrating');
      const calibration = await apiClient.calibrateBoardCamera({ matchId: state?.matchId ?? matchId });
      setCalibrationQuality(calibration.quality);
      setTimeout(() => setCameraStatus('waiting_for_pull'), 800);
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Unbekannter Fehler';
      setCameraHint(`Kamera konnte nicht gestartet werden: ${reason}`);
      setErrorMessage(
        autoAttempt
          ? 'Auto-Kamera konnte nicht gestartet werden. Bitte auf "Kamera" tippen und Berechtigung erlauben.'
          : 'Kamera-Start fehlgeschlagen. Bitte Kamera-Berechtigung im Browser erlauben.',
      );
    }
  };

  const addDartToTurn = () => {
    if (pendingX01.length >= 3) return;
    const effectiveMultiplier: 1 | 2 | 3 = selected === 50 ? 1 : selected === 25 ? (multiplier === 3 ? 2 : multiplier) : multiplier;
    const points = Math.min(60, selected === 50 ? 50 : selected * effectiveMultiplier);
    const label = selected === 0 ? 'Miss' : selected === 25 ? `Bull x${effectiveMultiplier}` : selected === 50 ? 'Bullseye' : `${selected} x${effectiveMultiplier}`;
    setPendingX01((prev) => [...prev, { points, multiplier: effectiveMultiplier, label, segment: selected }]);
    setErrorMessage(null);
    setCameraStatus('waiting_for_pull');
  };

  const addCricketThrowToTurn = () => {
    if (pendingCricket.length >= 3) return;
    const effectiveMultiplier: 1 | 2 | 3 = cricketTarget === 25 && multiplier === 3 ? 2 : multiplier;
    setPendingCricket((prev) => [...prev, { targetNumber: cricketTarget, multiplier: effectiveMultiplier }]);
    setErrorMessage(null);
    setCameraStatus('waiting_for_pull');
  };

  const clearTurn = () => {
    setPendingX01([]);
    setPendingCricket([]);
  };

  const saveHistory = (next: MatchStateDto, turnScoresOverride?: Record<string, number[]>, segmentStatsOverride?: Record<string, { segments: Record<string, number>; doubles: Record<string, number> }>) => {
    if (!next.winnerPlayerId) return;
    const winner = next.players.find((p) => p.playerId === next.winnerPlayerId);
    const winnerScore = next.scoreboard.find((s) => s.playerId === next.winnerPlayerId);
    const loserScore = next.scoreboard.find((s) => s.playerId !== next.winnerPlayerId);
    const resultLabel = winnerScore && loserScore
      ? `${winnerScore.sets}:${loserScore.sets} Sets · ${winnerScore.legs}:${loserScore.legs} Legs`
      : 'Match abgeschlossen';

    const turnScores = turnScoresOverride ?? playerTurnScores;
    const playerMatchStats = next.players.map((p) => {
      const turns = turnScores[p.playerId] ?? [];
      const first9 = turns.slice(0, 3);
      const first9Average = first9.length > 0 ? Number((first9.reduce((a, b) => a + b, 0) / first9.length).toFixed(1)) : 0;
      const matchAverage = turns.length > 0 ? Number((turns.reduce((a, b) => a + b, 0) / turns.length).toFixed(1)) : Number(p.average.toFixed(1));

      const legDartsWon = (next.legResults ?? [])
        .filter((l) => l.winnerPlayerId === p.playerId)
        .map((l) => l.dartsUsedByWinner)
        .filter((v) => v > 0);

      return {
        playerId: p.playerId,
        displayName: p.displayName,
        first9Average,
        matchAverage,
        checkoutAttempts: Math.max(0, Math.round((p.checkoutPercentage > 0 ? 100 / p.checkoutPercentage : 0) * (p.checkoutPercentage > 0 ? 1 : 0))),
        successfulCheckouts: p.checkoutPercentage > 0 ? 1 : 0,
        bestLegDarts: legDartsWon.length > 0 ? Math.min(...legDartsWon) : null,
        worstLegDarts: legDartsWon.length > 0 ? Math.max(...legDartsWon) : null,
      };
    });

    const entry: HistoryEntry = {
      id: next.matchId,
      playedAt: new Date().toISOString(),
      mode: next.mode,
      players: next.players.map((p) => ({ id: p.playerId, name: p.displayName })),
      winnerPlayerId: next.winnerPlayerId,
      winnerName: winner?.displayName ?? null,
      resultLabel,
      playerTurnScores: turnScores,
      legResults: next.legResults,
      playerMatchStats,
      playerSegmentStats: segmentStatsOverride ?? playerSegmentStats,
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

  const endMatchSession = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    window.localStorage.removeItem('htown-active-match-id');
    window.localStorage.removeItem(`htown-match-paused-${matchId}`);
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


  const runCameraDetection = async () => {
    if (!state) return;
    setCameraStatus('detecting');
    const suggestedPoints = Math.min(180, selected === 50 ? 50 : Math.max(0, selected * multiplier));
    const result = await apiClient.detectThrowWithCamera({
      matchId: state.matchId,
      suggestedPoints,
      suggestedMultiplier: multiplier,
    });

    if (result.requiresManualReview) {
      setCameraReviewDraft({
        turnId: result.turnId,
        points: result.points,
        multiplier: result.multiplier,
        confidence: result.confidence,
      });
      setCameraDetection(null);
      setErrorMessage('KI-Vorschlag hat geringe Sicherheit. Bitte manuell prüfen und bestätigen.');
      setCameraStatus('waiting_for_pull');
      return;
    }

    setCameraReviewDraft(null);
    setCameraDetection({
      turnId: result.turnId,
      points: result.points,
      multiplier: result.multiplier,
      confidence: result.confidence,
      requiresManualReview: result.requiresManualReview,
    });
    setErrorMessage(null);
    setCameraStatus('waiting_for_pull');
  };



  const applyManualCameraReview = async () => {
    if (!state || !cameraReviewDraft) return;
    const corrected = await apiClient.applyManualCameraCorrection({
      matchId: state.matchId,
      turnId: cameraReviewDraft.turnId,
      correctedPoints: Math.max(0, Math.min(180, cameraReviewDraft.points)),
      correctedMultiplier: cameraReviewDraft.multiplier,
      reason: 'manual-review-confirmed',
    });

    setCameraDetection({
      turnId: cameraReviewDraft.turnId,
      points: corrected.points,
      multiplier: corrected.multiplier,
      confidence: corrected.confidence,
      requiresManualReview: false,
    });
    setCameraReviewDraft(null);
    setErrorMessage(null);
    setCameraStatus('waiting_for_pull');
  };
  const submitTurn = async () => {
    if (!state) return;
    if (isMatchPaused) { setErrorMessage('Match ist pausiert. Erst fortsetzen.'); return; }
    if (bullOffRequired) { setErrorMessage('Ausbullen erforderlich. Bitte Sieger per Bull-Off festlegen.'); return; }
    setSubmitting(true);
    setErrorMessage(null);

    try {
      let nextState = state;
      const activeBefore = state.activePlayerId;
      let turnScoreForStats = 0;

      if (isCricket) {
        if (pendingCricket.length === 0) {
          setErrorMessage('Bitte bis zu 3 Darts hinzufügen.');
          return;
        }

        const beforeCricket = state.players.find((p) => p.playerId === activeBefore)?.cricketScore ?? 0;
        nextState = await apiClient.registerCricketVisit(nextState.matchId, { throws: pendingCricket });
        const afterCricket = nextState.players.find((p) => p.playerId === activeBefore)?.cricketScore ?? beforeCricket;
        turnScoreForStats = Math.max(0, afterCricket - beforeCricket);
      } else {
        if (!quickEntryMode && pendingX01.length === 0) {
          setErrorMessage('Bitte bis zu 3 Darts hinzufügen.');
          return;
        }

        const quickPoints = Number(quickTurnPoints || 0);
        const totalPoints = quickEntryMode ? Math.max(0, Math.min(180, quickPoints)) : pendingX01.reduce((sum, dart) => sum + dart.points, 0);
        turnScoreForStats = totalPoints;
        const finalDartMultiplier = quickEntryMode ? quickFinalMultiplier : (pendingX01[pendingX01.length - 1]?.multiplier ?? 1);

        nextState = await apiClient.registerTurn(nextState.matchId, {
          points: totalPoints,
          finalDartMultiplier,
          dartsUsed: quickEntryMode ? 3 : Math.max(1, Math.min(3, pendingX01.length)) as 1 | 2 | 3,
        });
      }

      const updatedTurnScores = { ...playerTurnScores, [activeBefore]: [...(playerTurnScores[activeBefore] ?? []), turnScoreForStats] };
      let updatedSegmentStats = playerSegmentStats;
      if (!isCricket && !quickEntryMode && pendingX01.length > 0) {
        const prev = playerSegmentStats[activeBefore] ?? { segments: {}, doubles: {} };
        const nextSegments = { ...prev.segments };
        const nextDoubles = { ...prev.doubles };
        for (const dart of pendingX01) {
          const segKey = dart.segment === 50 ? 'bullseye' : dart.segment === 25 ? 'bull' : String(dart.segment);
          nextSegments[segKey] = (nextSegments[segKey] ?? 0) + 1;
          if (dart.multiplier === 2) nextDoubles[segKey] = (nextDoubles[segKey] ?? 0) + 1;
        }
        updatedSegmentStats = {
          ...playerSegmentStats,
          [activeBefore]: { segments: nextSegments, doubles: nextDoubles },
        };
        setPlayerSegmentStats(updatedSegmentStats);
      }

      setState(nextState);
      setPlayerTurnScores(updatedTurnScores);
      setTurnCounter((t) => t + 1);
      setDartCounter((d) => d + (isCricket ? pendingCricket.length : quickEntryMode ? 3 : pendingX01.length));
      clearTurn();
      if (quickEntryMode) setQuickTurnPoints('');

      if (nextState.winnerPlayerId) {
        saveHistory(nextState, updatedTurnScores, updatedSegmentStats);
        await syncTournamentResultIfNeeded(nextState);
        endMatchSession();
        endMatchSession();
    navigate(`/match-summary${tournamentId ? '?back=tournaments' : ''}`);
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
    saveHistory(next, playerTurnScores, playerSegmentStats);
    await syncTournamentResultIfNeeded(next);
    endMatchSession();
    navigate(`/match-summary${tournamentId ? '?back=tournaments' : ''}`);
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {state.players.map((p) => {
            const profile = localPlayers.find((lp) => lp.id === p.playerId || lp.displayName.toLowerCase() === p.displayName.toLowerCase());
            return (
              <article key={p.playerId} className="rounded-2xl card-bg border soft-border p-4">
                <h4 className="text-sm uppercase mb-2">{p.displayName}</h4>
                <p className="text-xs muted-text">Ø {Math.round((profile?.currentAverage ?? p.average) * 10) / 10}</p>
                <p className="text-xs muted-text">Checkout {Math.round((profile?.checkoutPercentage ?? p.checkoutPercentage) * 10) / 10}%</p>
                <p className="text-xs muted-text">Pressure {profile?.pressurePerformanceIndex ?? 50}/100</p>
              </article>
            );
          })}
        </div>

        <button onClick={() => setShowPreMatchTips((v) => !v)} className="w-full rounded-xl bg-slate-800 p-2 text-xs text-left">
          Tipps {showPreMatchTips ? 'ausblenden' : 'einblenden'}
        </button>

        {showPreMatchTips && (
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
        )}

        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => {
            const names = state.players
              .map((p) => {
                const local = localPlayers.find((lp) => lp.id === p.playerId || lp.displayName.toLowerCase() === p.displayName.toLowerCase());
                if (local && local.introAnnouncementEnabled === false) return null;
                return local?.nickname ? `${p.displayName} \"${local.nicknamePronunciation || local.nickname}\"` : p.displayName;
              })
              .filter(Boolean)
              .join(' gegen ');
            if (!names || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
            const utterance = new SpeechSynthesisUtterance(`Matchup: ${names}`);
            utterance.rate = 0.95;
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(utterance);
          }} className="w-full rounded-xl bg-slate-800 p-3 text-xs">Ansage abspielen</button>
          <button onClick={() => setPreMatchSeen(true)} className="w-full rounded-xl bg-sky-400 p-3 font-semibold text-slate-900">Match starten</button>
        </div>
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
              {p.playerId === legStarterPlayerId && (
                <span className="mt-1 inline-block rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-semibold text-slate-900">
                  🎯
                </span>
              )}
              <p className="text-5xl font-bold leading-none mt-1">{isCricket ? p.cricketScore : p.score}</p>
              <p className="text-xs muted-text mt-1">Ø {p.average}</p>
            </div>
          );
        })}
      </div>


      {isCricket && state.players.length >= 2 && (
        <div className="w-full max-w-xl rounded-2xl border soft-border card-bg p-3">
          <p className="text-xs uppercase muted-text mb-2">Cricket Board</p>
          <div className="grid grid-cols-[56px_1fr_1fr] gap-1 text-[11px] items-center">
            <div className="muted-text">Zahl</div>
            <div className="muted-text text-center">{state.players[0].displayName}</div>
            <div className="muted-text text-center">{state.players[1].displayName}</div>
            {[20,19,18,17,16,15,25].map((n) => {
              const a = n === 25 ? state.players[0].cricketMarks.bull : state.players[0].cricketMarks[`m${n}` as keyof typeof state.players[0]['cricketMarks']];
              const b = n === 25 ? state.players[1].cricketMarks.bull : state.players[1].cricketMarks[`m${n}` as keyof typeof state.players[1]['cricketMarks']];
              return (
                <div key={`row-${n}`} className="contents">
                  <div className="rounded bg-slate-800 p-1 text-center">{n === 25 ? 'Bull' : n}</div>
                  <div className={`rounded p-1 text-center ${Number(a) >= 3 ? 'bg-emerald-900/40 text-emerald-200' : 'bg-slate-800'}`}>{Number(a)}/3</div>
                  <div className={`rounded p-1 text-center ${Number(b) >= 3 ? 'bg-emerald-900/40 text-emerald-200' : 'bg-slate-800'}`}>{Number(b)}/3</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <p className="primary-text text-sm font-semibold">{active?.displayName} wirft (3 Darts)</p>

      <div className="w-full max-w-xl rounded-lg border soft-border bg-slate-900/60 p-2 text-xs">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => { const next = !isMatchPaused; setIsMatchPaused(next); window.localStorage.setItem(`htown-match-paused-${matchId}`, next ? '1' : '0'); }} className="rounded bg-amber-800 px-2 py-1">{isMatchPaused ? 'Match fortsetzen' : 'Match pausieren'}</button>
          <button onClick={() => setShowEndConfirm(true)} className="rounded bg-red-800 px-2 py-1">Match abbrechen/beenden</button>
        </div>
        {isMatchPaused && <p className="mt-1 text-amber-200">Match ist pausiert. Keine Turn-Eingaben möglich.</p>}
      </div>

      {showEndConfirm && (
        <div className="w-full max-w-xl rounded-lg border border-red-400/40 bg-red-950/50 p-2 text-xs space-y-2">
          <p>Willst du das laufende Match wirklich beenden/abbrechen?</p>
          <div className="flex gap-2">
            <button onClick={() => { endMatchSession(); navigate('/'); }} className="rounded bg-red-700 px-2 py-1">Ja, beenden</button>
            <button onClick={() => setShowEndConfirm(false)} className="rounded bg-slate-800 px-2 py-1">Zurück</button>
          </div>
        </div>
      )}

      {leadInfo && (
        <div className="w-full max-w-xl rounded-lg border soft-border bg-slate-900/60 p-2 text-xs">
          <p>{leadInfo.setLead} · {leadInfo.legLead}</p>
        </div>
      )}
      {!isCricket && checkoutSuggestions.length > 0 && (
        <div className="w-full max-w-xl rounded-lg border soft-border bg-slate-900/60 p-2 text-xs">
          <p className="muted-text">Checkout Vorschläge ({active?.score} Rest)</p>
          <p className="primary-text">{checkoutSuggestions.join(' · ')}</p>
        </div>
      )}

      {!isCricket && turnProjection && (
        <div className="w-full max-w-xl rounded-lg border soft-border bg-slate-900/60 p-2 text-xs">
          <p className="muted-text">Turn-Vorschau</p>
          <p>
            Eingabe: <span className="primary-text font-semibold">{turnProjection.turnPoints}</span> ·
            Rest nach Turn: <span className={`font-semibold ${turnProjection.bust ? 'text-red-300' : 'primary-text'}`}> {turnProjection.projected}</span>
            {turnProjection.bust ? ' (Bust)' : turnProjection.checkoutNow ? ' (Checkout möglich)' : ''}
          </p>
        </div>
      )}

      <div className="w-full max-w-xl rounded-2xl border soft-border card-bg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm uppercase">Wurf Eingabe</h3>
          <button onClick={() => void toggleCamera(false)} className="rounded-lg bg-slate-800 px-2 py-1 text-xs flex items-center gap-1">
            {cameraOn ? <CameraOff size={14} /> : <Camera size={14} />} {cameraOn ? 'Kamera aus' : 'Kamera'}
          </button>
        </div>

        {cameraOn && <video ref={videoRef} className="w-full rounded-xl border soft-border bg-black" muted playsInline />}
        {cameraHint && <p className="text-[11px] muted-text">{cameraHint}</p>}
        {cameraOn && <p className="text-[11px] muted-text">Wenn Bild schwarz bleibt: Kamera aus/an tippen oder Browser neu laden.</p>}

        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((v) => {
            const tripleBlocked = (selected === 25 || cricketTarget === 25) && v === 3;
            return (
              <button key={v} onClick={() => !tripleBlocked && setMultiplier(v as 1 | 2 | 3)} disabled={tripleBlocked} className={`rounded-lg p-2 text-sm ${multiplier === v ? 'bg-sky-400 text-slate-900 font-semibold' : 'bg-slate-800'} disabled:opacity-40`}>
                {v === 1 ? 'Single' : v === 2 ? 'Double' : 'Triple'}
              </button>
            );
          })}
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
            <button onClick={() => setQuickEntryMode((v) => !v)} className="w-full rounded bg-slate-800 p-1.5 text-xs text-left flex items-center justify-between">
              <span>Eingabemodus</span>
              <span className={quickEntryMode ? 'text-emerald-300' : 'text-slate-400'}>{quickEntryMode ? 'Gesamt-3-Dart' : 'Einzel-Darts'}</span>
            </button>

            {!quickEntryMode && (<>
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
            <div className="grid grid-cols-2 gap-2">
              <button onClick={addDartToTurn} disabled={pendingX01.length >= 3} className="w-full rounded-lg bg-slate-800 p-2 text-xs">Dart hinzufügen ({pendingX01.length}/3)</button>
              <button onClick={() => void runCameraDetection()} className="w-full rounded-lg bg-slate-800 p-2 text-xs">KI Dart erkennen</button>
            </div>

            {cameraReviewDraft && (
              <div className="rounded bg-amber-900/20 border border-amber-300/40 p-2 text-[11px] space-y-2">
                <p>Manuelle Kamera-Prüfung nötig · Confidence {Math.round(cameraReviewDraft.confidence * 100)}%</p>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    min={0}
                    max={180}
                    value={cameraReviewDraft.points}
                    onChange={(e) => setCameraReviewDraft((d) => d ? { ...d, points: Number(e.target.value || 0) } : d)}
                    className="rounded bg-slate-800 p-2"
                    placeholder="Punkte"
                  />
                  <select
                    value={cameraReviewDraft.multiplier}
                    onChange={(e) => setCameraReviewDraft((d) => d ? { ...d, multiplier: Number(e.target.value) as 1 | 2 | 3 } : d)}
                    className="rounded bg-slate-800 p-2"
                  >
                    <option value={1}>Single</option>
                    <option value={2}>Double</option>
                    <option value={3}>Triple</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => void applyManualCameraReview()} className="rounded bg-amber-300 text-slate-900 px-2 py-1 font-semibold">Korrektur speichern</button>
                  <button onClick={() => setCameraReviewDraft(null)} className="rounded bg-slate-800 px-2 py-1">Verwerfen</button>
                </div>
              </div>
            )}

            {cameraDetection && (
              <div className="rounded bg-slate-900/70 border soft-border p-2 text-[11px]">
                <p>KI Vorschlag: {cameraDetection.points} Punkte · x{cameraDetection.multiplier} · Confidence {Math.round(cameraDetection.confidence * 100)}%</p>
                <button
                  onClick={() => {
                    const label = `${Math.max(0, Math.round(cameraDetection.points / Math.max(1, cameraDetection.multiplier)))} x${cameraDetection.multiplier}`;
                    setPendingX01((prev) => prev.length >= 3 ? prev : [...prev, { points: cameraDetection.points, multiplier: cameraDetection.multiplier, label, segment: Math.max(0, Math.round(cameraDetection.points / Math.max(1, cameraDetection.multiplier))) }]);
                  }}
                  className="mt-1 rounded bg-slate-800 px-2 py-1"
                >Vorschlag übernehmen</button>
              </div>
            )}
            <p className="text-xs muted-text">Turn: {pendingX01.map((d, i) => `#${i + 1} ${d.label}=${d.points}`).join(' · ') || '—'}</p>
            {pendingX01.length > 0 && (
              <div className="space-y-1">
                {pendingX01.map((d, i) => (
                  <div key={`${d.label}-${i}`} className="rounded bg-slate-900/60 p-1 text-[11px] flex items-center justify-between">
                    <span>#{i + 1} {d.label} = {d.points}</span>
                    <div className="flex gap-1">
                      <button onClick={() => replacePendingDart(i)} className="rounded bg-slate-800 px-2">ersetzen</button>
                      <button onClick={() => removePendingDart(i)} className="rounded bg-slate-800 px-2">entfernen</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            </>)}

            <div className="rounded border soft-border bg-slate-900/60 p-2 space-y-2">
              <p className="text-[11px] muted-text">{quickEntryMode ? 'Gesamtergebnis-Input aktiv. Einzel-Darts sind ausgeblendet.' : 'Einzel-Dart-Input aktiv. Für Gesamt-Input oben umschalten.'}</p>
              {quickEntryMode && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <input value={quickTurnPoints} onChange={(e) => setQuickTurnPoints(e.target.value)} type="number" min={0} max={180} className="rounded bg-slate-800 p-2" placeholder="Gesamtergebnis (0-180)" />
                    <select value={quickFinalMultiplier} onChange={(e) => setQuickFinalMultiplier(Number(e.target.value) as 1 | 2 | 3)} className="rounded bg-slate-800 p-2">
                      <option value={1}>Final Dart Single</option>
                      <option value={2}>Final Dart Double</option>
                      <option value={3}>Final Dart Triple</option>
                    </select>
                  </div>
                  <div>
                    <p className="text-[11px] muted-text mb-1">Schnellwerte</p>
                    <div className="flex flex-wrap gap-1">
                      {quickTurnPresets.map((preset) => (
                        <button key={`preset-${preset}`} onClick={() => setQuickTurnPoints(String(preset))} className="rounded bg-slate-800 px-2 py-1 text-[11px]">
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button onClick={clearTurn} className="rounded-xl bg-slate-700 p-2 text-sm">Turn löschen</button>
          <button onClick={submitTurn} disabled={submitting} className="rounded-xl bg-sky-400 p-2 text-slate-900 font-semibold">
            {submitting ? 'Speichern…' : quickEntryMode ? 'Gesamt-Turn eintragen' : '3-Dart Turn eintragen'}
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
