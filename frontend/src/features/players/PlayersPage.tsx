import { useMemo, useRef, useState } from 'react';
import { Search, UserPlus, X, Sparkles, Upload, Camera, CameraOff, Loader2 } from 'lucide-react';

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
  membershipStatus: MembershipStatus;
  preferredCheckoutMode: CheckoutMode;
  notes: string;
  currentAverage: number;
  checkoutPercentage: number;
  pressurePerformanceIndex: number;
  total180s: number;
  avatarUrl: string;
};

const STORAGE_KEY = 'htown-players';
const SEED_VERSION_KEY = 'htown-player-seed-version';
const SEED_VERSION = 'v1-force-reset-5';

const SEED_PLAYERS: ManagedPlayer[] = [
  { id: 'seed-lukas', displayName: 'Lukas Weber', membershipStatus: 'CLUB_MEMBER', preferredCheckoutMode: 'DOUBLE_OUT', notes: 'Captain, strong checkout routes.', currentAverage: 71, checkoutPercentage: 38, pressurePerformanceIndex: 79, total180s: 24, avatarUrl: '' },
  { id: 'seed-mert', displayName: 'Mert Kaya', membershipStatus: 'CLUB_MEMBER', preferredCheckoutMode: 'MASTER_OUT', notes: 'Explosive scoring profile.', currentAverage: 74, checkoutPercentage: 31, pressurePerformanceIndex: 68, total180s: 33, avatarUrl: '' },
  { id: 'seed-jonas', displayName: 'Jonas Hoffmann', membershipStatus: 'CLUB_MEMBER', preferredCheckoutMode: 'DOUBLE_OUT', notes: 'Reliable doubles specialist.', currentAverage: 63, checkoutPercentage: 41, pressurePerformanceIndex: 73, total180s: 9, avatarUrl: '' },
  { id: 'seed-sarah', displayName: 'Sarah Neumann', membershipStatus: 'TRIAL', preferredCheckoutMode: 'SINGLE_OUT', notes: 'Schnuppermodus, first league prep.', currentAverage: 47, checkoutPercentage: 22, pressurePerformanceIndex: 52, total180s: 1, avatarUrl: '' },
  { id: 'seed-ben', displayName: 'Ben Albrecht', membershipStatus: 'TRIAL', preferredCheckoutMode: 'DOUBLE_OUT', notes: 'Schnuppermodus, strong on T20 reps.', currentAverage: 54, checkoutPercentage: 25, pressurePerformanceIndex: 57, total180s: 3, avatarUrl: '' },
];

async function generateHtownAvatar(displayName: string, seed = 'htown'): Promise<string> {
  const prompt = encodeURIComponent(`professional darts player portrait, H-Town United dart jersey, dark arena lights, realistic, ${displayName}`);
  const url = `https://image.pollinations.ai/prompt/${prompt}?width=512&height=512&seed=${encodeURIComponent(`${seed}-${displayName}`)}`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('image generation failed');
    const blob = await response.blob();
    return await blobToDataUrl(blob);
  } catch {
    return '';
  }
}

async function stylizeFromSourceImage(sourceDataUrl: string): Promise<string> {
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

  ctx.filter = 'contrast(1.12) saturate(1.15)';
  ctx.drawImage(img, dx, dy, drawW, drawH);
  ctx.filter = 'none';

  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  grad.addColorStop(0, 'rgba(0,255,210,0.12)');
  grad.addColorStop(1, 'rgba(0,80,255,0.18)');
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
      return SEED_PLAYERS;
    }

    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_PLAYERS));
      return SEED_PLAYERS;
    }

    try {
      return JSON.parse(raw) as ManagedPlayer[];
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
  const [avatarInput, setAvatarInput] = useState('');
  const [sourcePhotoInput, setSourcePhotoInput] = useState('');
  const [cameraOn, setCameraOn] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const persist = (next: ManagedPlayer[]) => {
    setPlayers(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const filtered = useMemo(() => players.filter((p) => p.displayName.toLowerCase().includes(query.toLowerCase())), [players, query]);

  const addPlayer = async () => {
    const trimmedName = nameInput.trim();
    if (!trimmedName) return;

    let finalAvatar = avatarInput;
    if (!finalAvatar) finalAvatar = await generateHtownAvatar(trimmedName, 'create');

    persist([
      ...players,
      {
        id: `p-${crypto.randomUUID().slice(0, 8)}`,
        displayName: trimmedName,
        membershipStatus: statusInput,
        nickname: nicknameInput.trim() || undefined,
        throwingArm: throwingArmInput,
        gripStyle: gripStyleInput.trim() || undefined,
        dartWeightGrams: dartWeightInput ? Number(dartWeightInput) : undefined,
        seasonsPlayed: Number(seasonsPlayedInput || 0),
        preferredCheckoutMode: modeInput,
        notes: '',
        currentAverage: 0,
        checkoutPercentage: 0,
        pressurePerformanceIndex: 0,
        total180s: 0,
        avatarUrl: finalAvatar || sourcePhotoInput || '',
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
    setAvatarInput('');
    setSourcePhotoInput('');
    setShowModal(false);
  };

  const generateAvatarForModal = async () => {
    const trimmedName = nameInput.trim();
    if (!trimmedName) return;
    setIsGenerating(true);
    try {
      if (sourcePhotoInput) {
        const styled = await stylizeFromSourceImage(sourcePhotoInput);
        setAvatarInput(styled);
      } else {
        const generated = await generateHtownAvatar(trimmedName, 'modal');
        setAvatarInput(generated);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const generateAvatarForPlayer = async (playerId: string, displayName: string) => {
    const generated = await generateHtownAvatar(displayName, playerId);
    if (!generated) return;
    persist(players.map((p) => (p.id === playerId ? { ...p, avatarUrl: generated } : p)));
  };

  const onUploadFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    setSourcePhotoInput(dataUrl);
    setAvatarInput(dataUrl);
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
                <button onClick={() => generateAvatarForPlayer(player.id, player.displayName)} className="mt-1 text-[11px] primary-text flex items-center gap-1">
                  <Sparkles size={12} /> KI-Bild generieren
                </button>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] rounded bg-slate-800 px-2 py-1 muted-text block">{player.preferredCheckoutMode.replace('_', ' ')}</span>
              <span className={`mt-1 inline-block text-[10px] rounded px-2 py-1 ${player.membershipStatus === 'CLUB_MEMBER' ? 'bg-emerald-900/40 text-emerald-200' : 'bg-amber-900/40 text-amber-200'}`}>
                {player.membershipStatus === 'CLUB_MEMBER' ? 'Vereinsmitglied' : 'Schnuppermodus'}
              </span>
            </div>
          </article>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-40 bg-black/55 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border soft-border card-bg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xl uppercase">Neues Mitglied</h3>
              <button onClick={() => { stopCamera(); setShowModal(false); setSourcePhotoInput(''); setAvatarInput(''); }}><X size={16} /></button>
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

            <div className="grid grid-cols-2 gap-2">
              <button onClick={generateAvatarForModal} disabled={isGenerating} className="rounded-xl bg-slate-800 p-2 text-xs flex items-center justify-center gap-1 disabled:opacity-60">
                {isGenerating ? <><Loader2 size={12} className="animate-spin" /> Generiere...</> : <><Sparkles size={12} /> KI generieren</>}
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="rounded-xl bg-slate-800 p-2 text-xs flex items-center justify-center gap-1">
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
            <p className="text-[11px] muted-text text-center">Tipp: Erst Foto hochladen/aufnehmen, dann KI generieren für realistischeren H-Town-Look.</p>

            <select value={modeInput} onChange={(e) => setModeInput(e.target.value as CheckoutMode)} className="w-full rounded-xl bg-slate-800 p-3">
              <option value="SINGLE_OUT">Single Out</option>
              <option value="DOUBLE_OUT">Double Out</option>
              <option value="MASTER_OUT">Master Out</option>
            </select>

            <select value={statusInput} onChange={(e) => setStatusInput(e.target.value as MembershipStatus)} className="w-full rounded-xl bg-slate-800 p-3">
              <option value="CLUB_MEMBER">Vereinsmitglied</option>
              <option value="TRIAL">Schnuppermodus</option>
            </select>

            <button onClick={() => void addPlayer()} className="w-full rounded-xl bg-sky-400 text-slate-900 font-semibold p-3">Mitglied hinzufügen</button>
          </div>
        </div>
      )}
    </section>
  );
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
