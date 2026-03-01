import { useMemo, useRef, useState } from 'react';
import { Search, UserPlus, X, Sparkles, Upload, Camera, CameraOff, Loader2, Pencil } from 'lucide-react';

type CheckoutMode = 'SINGLE_OUT' | 'DOUBLE_OUT' | 'MASTER_OUT';
type MembershipStatus = 'CLUB_MEMBER' | 'TRIAL';

type ManagedPlayer = {
  id: string;
  displayName: string;
  nickname?: string;
  throwingArm?: 'RIGHT' | 'LEFT' | 'BOTH';
  gripStyle?: string;
  dartWeightGrams?: number;
  seasonsPlayed?: number;
  nicknamePronunciation?: string;
  announcerStyle?: 'ARENA' | 'CLASSIC' | 'HYPE' | 'COOL' | 'INTIMIDATOR';
  introAnnouncementEnabled?: boolean;
  membershipStatus: MembershipStatus;
  preferredCheckoutMode: CheckoutMode;
  notes: string;
  currentAverage: number;
  checkoutPercentage: number;
  pressurePerformanceIndex: number;
  total180s: number;
  avatarUrl: string;
  avatarSourcePhoto?: string;
  avatarKind?: 'GENERIC_AI' | 'PHOTO_STYLIZED';
  avatarStyle?: 'REALISTIC' | 'COMIC' | 'NEON';
  ownerUserId?: string;
};

const STORAGE_KEY = 'htown-players';
const SEED_VERSION_KEY = 'htown-player-seed-version';
const SEED_VERSION = 'v1-force-reset-5';


const PRONUNCIATION_PRESETS = [
  'Original',
  'Deutsch klar',
  'Englisch klar',
  'Bühnenname langsam',
  'Bühnenname hart',
  'Sportkommentator',
  'Arena Hype',
  'League neutral',
  'VIP Intro',
  'Intimidator',
  'Street Style',
  'Creator Tag',
] as const;

type PronunciationPreset = (typeof PRONUNCIATION_PRESETS)[number];

const SEED_PLAYERS: ManagedPlayer[] = [
  { id: 'seed-lukas', displayName: 'Lukas Weber', membershipStatus: 'CLUB_MEMBER', preferredCheckoutMode: 'DOUBLE_OUT', notes: 'Captain, strong checkout routes.', currentAverage: 71, checkoutPercentage: 38, pressurePerformanceIndex: 79, total180s: 24, avatarUrl: '' },
  { id: 'seed-mert', displayName: 'Mert Kaya', membershipStatus: 'CLUB_MEMBER', preferredCheckoutMode: 'MASTER_OUT', notes: 'Explosive scoring profile.', currentAverage: 74, checkoutPercentage: 31, pressurePerformanceIndex: 68, total180s: 33, avatarUrl: '' },
  { id: 'seed-jonas', displayName: 'Jonas Hoffmann', membershipStatus: 'CLUB_MEMBER', preferredCheckoutMode: 'DOUBLE_OUT', notes: 'Reliable doubles specialist.', currentAverage: 63, checkoutPercentage: 41, pressurePerformanceIndex: 73, total180s: 9, avatarUrl: '' },
  { id: 'seed-sarah', displayName: 'Sarah Neumann', membershipStatus: 'TRIAL', preferredCheckoutMode: 'SINGLE_OUT', notes: 'Schnuppermodus, first league prep.', currentAverage: 47, checkoutPercentage: 22, pressurePerformanceIndex: 52, total180s: 1, avatarUrl: '' },
  { id: 'seed-ben', displayName: 'Ben Albrecht', membershipStatus: 'TRIAL', preferredCheckoutMode: 'DOUBLE_OUT', notes: 'Schnuppermodus, strong on T20 reps.', currentAverage: 54, checkoutPercentage: 25, pressurePerformanceIndex: 57, total180s: 3, avatarUrl: '' },
];

async function generateGenericDartAvatar(displayName: string, seed = 'htown', style: 'REALISTIC' | 'COMIC' | 'NEON' = 'COMIC'): Promise<string> {
  const stylePrompt = style === 'REALISTIC'
    ? 'stylized fictional darts pro avatar, semi-realistic digital art, no real person'
    : style === 'NEON'
      ? 'futuristic neon comic darts avatar, cyber style, no real person'
      : 'comic esports darts avatar, graphic style, no real person';
  const prompt = encodeURIComponent(`${stylePrompt}, H-Town United jersey, clean face portrait, ${displayName}`);
  const url = `https://image.pollinations.ai/prompt/${prompt}?width=512&height=512&seed=${encodeURIComponent(`${seed}-${displayName}`)}`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('image generation failed');
    const blob = await response.blob();
    return await blobToDataUrl(blob);
  } catch {
    return buildFallbackAvatar(displayName, style);
  }
}

async function generateProAvatarFromSourceImage(sourceDataUrl: string, style: "REALISTIC" | "COMIC" | "NEON" = "REALISTIC"): Promise<string> {
  const img = await loadImage(sourceDataUrl);
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 768;
  const ctx = canvas.getContext('2d');
  if (!ctx) return sourceDataUrl;

  const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
  const drawW = img.width * scale;
  const drawH = img.height * scale;
  const dx = (canvas.width - drawW) / 2;
  const dy = (canvas.height - drawH) / 2;

  const baseFilter = style === 'NEON' ? 'contrast(1.2) saturate(1.35)' : style === 'COMIC' ? 'contrast(1.18) saturate(1.25)' : 'contrast(1.1) saturate(1.12)';
  ctx.filter = baseFilter;
  ctx.drawImage(img, dx, dy, drawW, drawH);
  ctx.filter = 'none';

  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  if (style === 'NEON') {
    grad.addColorStop(0, 'rgba(0,255,210,0.2)');
    grad.addColorStop(1, 'rgba(255,0,200,0.22)');
  } else if (style === 'COMIC') {
    grad.addColorStop(0, 'rgba(255,180,0,0.14)');
    grad.addColorStop(1, 'rgba(0,120,255,0.16)');
  } else {
    grad.addColorStop(0, 'rgba(0,255,210,0.12)');
    grad.addColorStop(1, 'rgba(0,80,255,0.18)');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = 'rgba(0,255,220,0.45)';
  ctx.lineWidth = 10;
  ctx.strokeRect(16, 16, canvas.width - 32, canvas.height - 32);

  return canvas.toDataURL('image/jpeg', 0.92);
}

export function PlayersPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraVideoRef = useRef<HTMLVideoElement | null>(null);

  const [players, setPlayers] = useState<ManagedPlayer[]>(() => {
    const seedVersion = window.localStorage.getItem(SEED_VERSION_KEY);
    if (seedVersion !== SEED_VERSION) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_PLAYERS));
      window.localStorage.setItem(SEED_VERSION_KEY, SEED_VERSION);
      return SEED_PLAYERS.map((p) => ({ ...p, ownerUserId: p.id }));
    }

    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_PLAYERS));
      return SEED_PLAYERS.map((p) => ({ ...p, ownerUserId: p.id }));
    }

    try {
      return (JSON.parse(raw) as ManagedPlayer[]).map((p) => ({ ...p, ownerUserId: p.ownerUserId ?? p.id }));
    } catch {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_PLAYERS));
      return SEED_PLAYERS;
    }
  });

  const [query, setQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [modeInput, setModeInput] = useState<CheckoutMode>('DOUBLE_OUT');
  const [statusInput, setStatusInput] = useState<MembershipStatus>('CLUB_MEMBER');
  const [nicknameInput, setNicknameInput] = useState('');
  const [throwingArmInput, setThrowingArmInput] = useState<'RIGHT' | 'LEFT' | 'BOTH'>('RIGHT');
  const [gripStyleInput, setGripStyleInput] = useState('');
  const [dartWeightInput, setDartWeightInput] = useState('');
  const [seasonsPlayedInput, setSeasonsPlayedInput] = useState('0');
  const [pronunciationPreset, setPronunciationPreset] = useState<PronunciationPreset>('Original');
  const [pronunciationInput, setPronunciationInput] = useState('');
  const [announcerStyleInput, setAnnouncerStyleInput] = useState<'ARENA' | 'CLASSIC' | 'HYPE' | 'COOL' | 'INTIMIDATOR'>('ARENA');
  const [introAnnouncementEnabledInput, setIntroAnnouncementEnabledInput] = useState(true);
  const [avatarInput, setAvatarInput] = useState('');
  const [sourcePhotoInput, setSourcePhotoInput] = useState('');
  const [cameraOn, setCameraOn] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadTarget, setUploadTarget] = useState<'modal' | string>('modal');
  const [avatarStyleInput, setAvatarStyleInput] = useState<'REALISTIC' | 'COMIC' | 'NEON'>('COMIC');
  const [editPlayerId, setEditPlayerId] = useState<string | null>(null);

  const auth = useMemo(() => {
    try {
      const raw = window.localStorage.getItem('htown-auth-context');
      if (!raw) return { userId: 'admin', role: 'ADMIN' as 'ADMIN' | 'PLAYER' };
      const parsed = JSON.parse(raw) as { userId?: string; role?: 'ADMIN' | 'PLAYER' };
      return { userId: parsed.userId || 'admin', role: parsed.role || 'ADMIN' };
    } catch {
      return { userId: 'admin', role: 'ADMIN' as 'ADMIN' | 'PLAYER' };
    }
  }, []);

  const canEditPlayer = (player: ManagedPlayer) => auth.role === 'ADMIN' || auth.userId === player.ownerUserId || auth.userId === player.id;

  const persist = (next: ManagedPlayer[]) => {
    setPlayers(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };


  const updatePlayerAvatar = (playerId: string, updater: (player: ManagedPlayer) => ManagedPlayer) => {
    persist(players.map((p) => (p.id === playerId ? updater(p) : p)));
  };


  const startEditPlayer = (player: ManagedPlayer) => {
    if (!canEditPlayer(player)) return;
    setEditPlayerId(player.id);
    setNameInput(player.displayName);
    setModeInput(player.preferredCheckoutMode);
    setStatusInput(player.membershipStatus);
    setNicknameInput(player.nickname ?? '');
    setThrowingArmInput(player.throwingArm ?? 'RIGHT');
    setGripStyleInput(player.gripStyle ?? '');
    setDartWeightInput(player.dartWeightGrams ? String(player.dartWeightGrams) : '');
    setSeasonsPlayedInput(String(player.seasonsPlayed ?? 0));
    setPronunciationInput(player.nicknamePronunciation ?? '');
    setAnnouncerStyleInput(player.announcerStyle ?? 'ARENA');
    setIntroAnnouncementEnabledInput(player.introAnnouncementEnabled ?? true);
    setAvatarInput(player.avatarUrl ?? '');
    setSourcePhotoInput(player.avatarSourcePhoto ?? '');
    setAvatarStyleInput(player.avatarStyle ?? 'COMIC');
    setShowModal(true);
  };

  const saveEditedPlayer = async () => {
    if (!editPlayerId) return;
    const target = players.find((p) => p.id === editPlayerId);
    if (!target || !canEditPlayer(target)) return;
    const trimmedName = nameInput.trim();
    if (!trimmedName) return;

    let finalAvatar = avatarInput;
    if (!finalAvatar) {
      finalAvatar = sourcePhotoInput
        ? await generateProAvatarFromSourceImage(sourcePhotoInput, avatarStyleInput)
        : await generateGenericDartAvatar(trimmedName, `edit-${editPlayerId}`, avatarStyleInput);
    }

    persist(players.map((p) => p.id === editPlayerId ? {
      ...p,
      displayName: trimmedName,
      membershipStatus: statusInput,
      preferredCheckoutMode: modeInput,
      nickname: nicknameInput.trim() || undefined,
      throwingArm: throwingArmInput,
      gripStyle: gripStyleInput.trim() || undefined,
      dartWeightGrams: dartWeightInput ? Number(dartWeightInput) : undefined,
      seasonsPlayed: Number(seasonsPlayedInput || 0),
      nicknamePronunciation: resolvePronunciation(nicknameInput, pronunciationInput, pronunciationPreset),
      announcerStyle: announcerStyleInput,
      introAnnouncementEnabled: introAnnouncementEnabledInput,
      avatarUrl: finalAvatar || p.avatarUrl,
      avatarSourcePhoto: sourcePhotoInput || p.avatarSourcePhoto,
      avatarKind: sourcePhotoInput ? 'PHOTO_STYLIZED' : (p.avatarKind ?? 'GENERIC_AI'),
      avatarStyle: avatarStyleInput,
    } : p));

    stopCamera();
    setEditPlayerId(null);
    setShowModal(false);
    setSourcePhotoInput('');
    setAvatarInput('');
  };

  const filtered = useMemo(() => players.filter((p) => p.displayName.toLowerCase().includes(query.toLowerCase())), [players, query]);

  const addPlayer = async () => {
    const trimmedName = nameInput.trim();
    if (!trimmedName) return;

    let finalAvatar = avatarInput;
    if (!finalAvatar) {
      finalAvatar = sourcePhotoInput
        ? await generateProAvatarFromSourceImage(sourcePhotoInput, avatarStyleInput)
        : await generateGenericDartAvatar(trimmedName, 'create', avatarStyleInput);
    }

    const newId = `p-${crypto.randomUUID().slice(0, 8)}`;

    persist([
      ...players,
      {
        id: newId,
        displayName: trimmedName,
        membershipStatus: statusInput,
        nickname: nicknameInput.trim() || undefined,
        throwingArm: throwingArmInput,
        gripStyle: gripStyleInput.trim() || undefined,
        dartWeightGrams: dartWeightInput ? Number(dartWeightInput) : undefined,
        seasonsPlayed: Number(seasonsPlayedInput || 0),
        nicknamePronunciation: resolvePronunciation(nicknameInput, pronunciationInput, pronunciationPreset),
        announcerStyle: announcerStyleInput,
        introAnnouncementEnabled: introAnnouncementEnabledInput,
        preferredCheckoutMode: modeInput,
        notes: '',
        currentAverage: 0,
        checkoutPercentage: 0,
        pressurePerformanceIndex: 0,
        total180s: 0,
        avatarUrl: finalAvatar || sourcePhotoInput || '',
        avatarSourcePhoto: sourcePhotoInput || undefined,
        avatarKind: sourcePhotoInput ? 'PHOTO_STYLIZED' : 'GENERIC_AI',
        avatarStyle: avatarStyleInput,
        ownerUserId: newId,
      },
    ]);

    stopCamera();
    setNameInput('');
    setModeInput('DOUBLE_OUT');
    setStatusInput('CLUB_MEMBER');
    setNicknameInput('');
    setThrowingArmInput('RIGHT');
    setGripStyleInput('');
    setDartWeightInput('');
    setSeasonsPlayedInput('0');
    setPronunciationPreset('Original');
    setPronunciationInput('');
    setAnnouncerStyleInput('ARENA');
    setIntroAnnouncementEnabledInput(true);
    setAvatarInput('');
    setSourcePhotoInput('');
    setAvatarStyleInput('COMIC');
    setShowModal(false);
  };

  const generateAvatarForModal = async () => {
    const trimmedName = nameInput.trim();
    if (!trimmedName) return;
    setIsGenerating(true);
    try {
      if (sourcePhotoInput) {
        const styled = await generateProAvatarFromSourceImage(sourcePhotoInput, avatarStyleInput);
        setAvatarInput(styled);
      } else {
        const generated = await generateGenericDartAvatar(trimmedName, 'modal', avatarStyleInput);
        setAvatarInput(generated);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const generateAvatarForPlayer = async (playerId: string, displayName: string) => {
    const player = players.find((p) => p.id === playerId);
    if (!player) return;

    const style = player.avatarStyle ?? 'COMIC';
    const generated = player.avatarSourcePhoto
      ? await generateProAvatarFromSourceImage(player.avatarSourcePhoto, style)
      : await generateGenericDartAvatar(displayName, playerId, style);

    if (!generated) return;
    updatePlayerAvatar(playerId, (p) => ({
      ...p,
      avatarUrl: generated,
      avatarKind: p.avatarSourcePhoto ? 'PHOTO_STYLIZED' : 'GENERIC_AI',
    }));
  };

  const onUploadFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);

    if (uploadTarget === 'modal') {
      setSourcePhotoInput(dataUrl);
      setAvatarInput(dataUrl);
    } else {
      const playerId = uploadTarget;
      const player = players.find((p) => p.id === playerId);
      if (!player) return;
      const styled = await generateProAvatarFromSourceImage(dataUrl, player.avatarStyle ?? "COMIC");
      updatePlayerAvatar(playerId, (p) => ({
        ...p,
        avatarSourcePhoto: dataUrl,
        avatarUrl: styled || dataUrl,
        avatarKind: 'PHOTO_STYLIZED',
        avatarStyle: p.avatarStyle ?? 'COMIC',
      }));
    }

    event.target.value = '';
  };

  const toggleCamera = async () => {
    if (cameraOn) {
      stopCamera();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = stream;
        await cameraVideoRef.current.play();
      }
      setCameraOn(true);
    } catch {
      setCameraOn(false);
    }
  };

  const capturePhoto = () => {
    if (!cameraVideoRef.current) return;
    const video = cameraVideoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 512;
    canvas.height = video.videoHeight || 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const captured = canvas.toDataURL('image/jpeg', 0.9);
    setSourcePhotoInput(captured);
    setAvatarInput(captured);
  };

  const stopCamera = () => {
    const stream = cameraVideoRef.current?.srcObject as MediaStream | null;
    stream?.getTracks().forEach((t) => t.stop());
    if (cameraVideoRef.current) cameraVideoRef.current.srcObject = null;
    setCameraOn(false);
  };


  const uploadSourceForPlayer = (playerId: string) => {
    setUploadTarget(playerId);
    fileInputRef.current?.click();
  };

  return (
    <section className="space-y-4 animate-[fadeIn_.25s_ease]">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl uppercase">Verein</h2>
        <button onClick={() => setShowModal(true)} className="rounded-lg bg-sky-400 text-slate-900 px-3 py-2 text-xs font-semibold flex items-center gap-1">
          <UserPlus size={14} /> Mitglied
        </button>
      </div>

      <div className="card-bg border soft-border rounded-xl p-3 flex items-center gap-2">
        <Search size={16} className="muted-text" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Mitglied suchen..." className="bg-transparent w-full text-sm outline-none" />
      </div>

      <div className="space-y-3">
        {filtered.map((player) => (
          <article key={player.id} className="card-bg border soft-border rounded-xl p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <img src={player.avatarUrl || '/branding/h-town-united-logo-tree.jpg'} className="h-12 w-12 rounded-lg object-cover" />
              <div className="min-w-0">
                <p className="font-semibold truncate">{player.displayName}{player.nickname ? ` "${player.nickname}"` : ''}</p>
                <p className="text-xs muted-text">Ø {player.currentAverage} · Checkout {player.checkoutPercentage}% · {player.total180s}x 180</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {canEditPlayer(player) && (
                    <button onClick={() => startEditPlayer(player)} className="text-[11px] text-slate-200 flex items-center gap-1">
                      <Pencil size={12} /> Bearbeiten
                    </button>
                  )}
                  <button onClick={() => generateAvatarForPlayer(player.id, player.displayName)} className="text-[11px] primary-text flex items-center gap-1">
                    <Sparkles size={12} /> KI-Bild aktualisieren
                  </button>
                  <button onClick={() => uploadSourceForPlayer(player.id)} className="text-[11px] text-amber-200 flex items-center gap-1">
                    <Upload size={12} /> Quelle hochladen
                  </button>
                  <button onClick={() => updatePlayerAvatar(player.id, (p) => ({ ...p, avatarStyle: p.avatarStyle === 'REALISTIC' ? 'COMIC' : p.avatarStyle === 'COMIC' ? 'NEON' : 'REALISTIC' }))} className="text-[11px] text-cyan-200 flex items-center gap-1">
                    <Sparkles size={12} /> Style wechseln
                  </button>
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] rounded bg-slate-800 px-2 py-1 muted-text block">{player.preferredCheckoutMode.replace('_', ' ')}</span>
              <span className={`mt-1 inline-block text-[10px] rounded px-2 py-1 ${player.membershipStatus === 'CLUB_MEMBER' ? 'bg-emerald-900/40 text-emerald-200' : 'bg-amber-900/40 text-amber-200'}`}>
                {player.membershipStatus === 'CLUB_MEMBER' ? 'Vereinsmitglied' : 'Schnuppermodus'}
              </span>
              <span className="mt-1 inline-block text-[10px] rounded px-2 py-1 bg-slate-800 text-slate-300">{player.avatarKind === 'PHOTO_STYLIZED' ? 'Foto-basiert' : 'Generisch'} · {player.avatarStyle ?? 'COMIC'}</span>
            </div>
          </article>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-40 bg-black/55 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border soft-border card-bg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xl uppercase">{editPlayerId ? 'Mitglied bearbeiten' : 'Neues Mitglied'}</h3>
              <button onClick={() => { stopCamera(); setShowModal(false); setSourcePhotoInput(''); setAvatarInput(''); setEditPlayerId(null); }}><X size={16} /></button>
            </div>

            <input value={nameInput} onChange={(e) => setNameInput(e.target.value)} placeholder="Vor- und Nachname" className="w-full rounded-xl bg-slate-800 border border-sky-400/60 p-3" />
            <input value={nicknameInput} onChange={(e) => setNicknameInput(e.target.value)} placeholder="Spitzname (optional)" className="w-full rounded-xl bg-slate-800 p-3" />
            <div className="grid grid-cols-2 gap-2">
              <select value={throwingArmInput} onChange={(e) => setThrowingArmInput(e.target.value as 'RIGHT' | 'LEFT' | 'BOTH')} className="rounded-xl bg-slate-800 p-3 text-sm">
                <option value="RIGHT">Wurfarm: Rechts</option>
                <option value="LEFT">Wurfarm: Links</option>
                <option value="BOTH">Wurfarm: Beidseitig</option>
              </select>
              <input value={gripStyleInput} onChange={(e) => setGripStyleInput(e.target.value)} placeholder="Gripart (optional)" className="rounded-xl bg-slate-800 p-3 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input type="number" min={8} step={1} value={dartWeightInput} onChange={(e) => setDartWeightInput(e.target.value)} placeholder="Dartgewicht g" className="rounded-xl bg-slate-800 p-3 text-sm" />
              <input type="number" min={0} step={1} value={seasonsPlayedInput} onChange={(e) => setSeasonsPlayedInput(e.target.value)} placeholder="Gespielte Saisons" className="rounded-xl bg-slate-800 p-3 text-sm" />
            </div>

            <div className="rounded-xl bg-slate-900/70 border soft-border p-3 space-y-2">
              <p className="text-xs uppercase muted-text">Ansage / Aussprache</p>
              <select value={pronunciationPreset} onChange={(e) => setPronunciationPreset(e.target.value as PronunciationPreset)} className="w-full rounded-lg bg-slate-800 p-2 text-xs">
                {PRONUNCIATION_PRESETS.map((preset) => <option key={preset}>{preset}</option>)}
              </select>
              <input value={pronunciationInput} onChange={(e) => setPronunciationInput(e.target.value)} placeholder="Freie Aussprache (z. B. Kay-Slash, Dii-Mon)" className="w-full rounded-lg bg-slate-800 p-2 text-xs" />
              <select value={announcerStyleInput} onChange={(e) => setAnnouncerStyleInput(e.target.value as 'ARENA' | 'CLASSIC' | 'HYPE' | 'COOL' | 'INTIMIDATOR')} className="w-full rounded-lg bg-slate-800 p-2 text-xs">
                <option value="ARENA">Arena</option>
                <option value="CLASSIC">Classic Caller</option>
                <option value="HYPE">Hype</option>
                <option value="COOL">Cool & clean</option>
                <option value="INTIMIDATOR">Intimidator</option>
              </select>
              <button onClick={() => previewAnnouncement(trimmedOrFallback(nameInput), trimmedOrFallback(nicknameInput), resolvePronunciation(nicknameInput, pronunciationInput, pronunciationPreset), announcerStyleInput)} className="w-full rounded bg-slate-800 p-2 text-xs">
                Ansage testen
              </button>
              <button onClick={() => setIntroAnnouncementEnabledInput((v) => !v)} className="w-full rounded bg-slate-800 p-2 text-xs text-left flex items-center justify-between">
                <span>Bei Matchstart ansagen</span><span className={introAnnouncementEnabledInput ? 'text-emerald-300' : 'text-slate-400'}>{introAnnouncementEnabledInput ? 'AN' : 'AUS'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <select value={avatarStyleInput} onChange={(e) => setAvatarStyleInput(e.target.value as 'REALISTIC' | 'COMIC' | 'NEON')} className="col-span-2 rounded-xl bg-slate-800 p-2 text-xs">
                <option value="REALISTIC">Style: Realistisch</option>
                <option value="COMIC">Style: Comic</option>
                <option value="NEON">Style: Neon</option>
              </select>
              <button onClick={generateAvatarForModal} disabled={isGenerating} className="rounded-xl bg-slate-800 p-2 text-xs flex items-center justify-center gap-1 disabled:opacity-60">
                {isGenerating ? <><Loader2 size={12} className="animate-spin" /> Generiere...</> : <><Sparkles size={12} /> KI generieren</>}
              </button>
              <button onClick={() => { setUploadTarget('modal'); fileInputRef.current?.click(); }} className="rounded-xl bg-slate-800 p-2 text-xs flex items-center justify-center gap-1">
                <Upload size={12} /> Bild hochladen
              </button>
              <button onClick={toggleCamera} className="col-span-2 rounded-xl bg-slate-800 p-2 text-xs flex items-center justify-center gap-1">
                {cameraOn ? <CameraOff size={12} /> : <Camera size={12} />} {cameraOn ? 'Kamera aus' : 'Foto aufnehmen'}
              </button>
            </div>

            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onUploadFile} />

            {cameraOn && (
              <div className="space-y-2">
                <video ref={cameraVideoRef} className="w-full rounded-xl border soft-border bg-black" muted playsInline />
                <button onClick={capturePhoto} className="w-full rounded-lg bg-sky-400 text-slate-900 p-2 text-xs font-semibold">Foto als Vorschau übernehmen</button>
              </div>
            )}

            {avatarInput && <img src={avatarInput} alt="Avatar preview" className="h-32 w-32 mx-auto rounded-xl object-cover border soft-border" />}
            {!avatarInput && <p className="text-[11px] muted-text text-center">Vorschau erscheint hier vor dem Speichern.</p>}
            <p className="text-[11px] muted-text text-center">Mit Foto: foto-basierte Pro-Optik. Ohne Foto: generischer Dart-Avatar (keine reale Person).</p>

            <select value={modeInput} onChange={(e) => setModeInput(e.target.value as CheckoutMode)} className="w-full rounded-xl bg-slate-800 p-3">
              <option value="SINGLE_OUT">Single Out</option>
              <option value="DOUBLE_OUT">Double Out</option>
              <option value="MASTER_OUT">Master Out</option>
            </select>

            <select value={statusInput} onChange={(e) => setStatusInput(e.target.value as MembershipStatus)} className="w-full rounded-xl bg-slate-800 p-3">
              <option value="CLUB_MEMBER">Vereinsmitglied</option>
              <option value="TRIAL">Schnuppermodus</option>
            </select>

            <button onClick={() => void (editPlayerId ? saveEditedPlayer() : addPlayer())} className="w-full rounded-xl bg-sky-400 text-slate-900 font-semibold p-3">{editPlayerId ? 'Änderungen speichern' : 'Mitglied hinzufügen'}</button>
          </div>
        </div>
      )}
    </section>
  );
}


function trimmedOrFallback(value: string): string {
  const t = value.trim();
  return t.length > 0 ? t : 'Spieler';
}

function resolvePronunciation(nickname: string, customPronunciation: string, preset: PronunciationPreset): string {
  const custom = customPronunciation.trim();
  if (custom) return custom;
  const nick = nickname.trim();
  if (!nick) return '';
  if (preset === 'Original') return nick;
  if (preset === 'Deutsch klar') return nick.replace(/-/g, ' ').replace(/z/gi, 'ts');
  if (preset === 'Englisch klar') return nick.replace(/-/g, ' ');
  if (preset === 'Bühnenname langsam') return nick.split('').join(' ');
  if (preset === 'Bühnenname hart') return `${nick}!`;
  if (preset === 'Arena Hype') return `${nick}, let's go`; 
  if (preset === 'Intimidator') return `The ${nick}`;
  return nick;
}

function previewAnnouncement(name: string, nickname: string, pronunciation: string, style: 'ARENA' | 'CLASSIC' | 'HYPE' | 'COOL' | 'INTIMIDATOR') {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  const nick = nickname ? ` "${pronunciation || nickname}" ` : ' ';
  const line = style === 'HYPE'
    ? `Make some noise! ${name}${nick}am Oche!`
    : style === 'CLASSIC'
      ? `Nächster Spieler: ${name}${nick}`
      : style === 'COOL'
        ? `${name}${nick}is ready.`
        : style === 'INTIMIDATOR'
          ? `Now entering: ${name}${nick}`
          : `Auftritt für ${name}${nick}`;

  const utterance = new SpeechSynthesisUtterance(line);
  utterance.rate = style === 'HYPE' ? 1.05 : style === 'CLASSIC' ? 0.9 : 0.95;
  utterance.pitch = style === 'INTIMIDATOR' ? 0.8 : 1;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

function buildFallbackAvatar(displayName: string, style: 'REALISTIC' | 'COMIC' | 'NEON' = 'COMIC'): string {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const grad = ctx.createLinearGradient(0, 0, 512, 512);
  if (style === 'NEON') {
    grad.addColorStop(0, '#0ea5e9');
    grad.addColorStop(1, '#d946ef');
  } else if (style === 'REALISTIC') {
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(1, '#1e3a8a');
  } else {
    grad.addColorStop(0, '#334155');
    grad.addColorStop(1, '#0ea5e9');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  const initials = displayName.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase() || 'HT';
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.font = 'bold 170px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(initials, 256, 256);

  return canvas.toDataURL('image/jpeg', 0.92);
}

async function fileToDataUrl(file: File): Promise<string> {

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}


function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
