import { useMemo, useState } from 'react';
import { Search, UserPlus, X } from 'lucide-react';

type CheckoutMode = 'SINGLE_OUT' | 'DOUBLE_OUT' | 'MASTER_OUT';
type MembershipStatus = 'CLUB_MEMBER' | 'TRIAL';

type ManagedPlayer = {
  id: string;
  displayName: string;
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
  {
    id: 'seed-lukas',
    displayName: 'Lukas Weber',
    membershipStatus: 'CLUB_MEMBER',
    preferredCheckoutMode: 'DOUBLE_OUT',
    notes: 'Captain, strong checkout routes.',
    currentAverage: 71,
    checkoutPercentage: 38,
    pressurePerformanceIndex: 79,
    total180s: 24,
    avatarUrl: '',
  },
  {
    id: 'seed-mert',
    displayName: 'Mert Kaya',
    membershipStatus: 'CLUB_MEMBER',
    preferredCheckoutMode: 'MASTER_OUT',
    notes: 'Explosive scoring profile.',
    currentAverage: 74,
    checkoutPercentage: 31,
    pressurePerformanceIndex: 68,
    total180s: 33,
    avatarUrl: '',
  },
  {
    id: 'seed-jonas',
    displayName: 'Jonas Hoffmann',
    membershipStatus: 'CLUB_MEMBER',
    preferredCheckoutMode: 'DOUBLE_OUT',
    notes: 'Reliable doubles specialist.',
    currentAverage: 63,
    checkoutPercentage: 41,
    pressurePerformanceIndex: 73,
    total180s: 9,
    avatarUrl: '',
  },
  {
    id: 'seed-sarah',
    displayName: 'Sarah Neumann',
    membershipStatus: 'TRIAL',
    preferredCheckoutMode: 'SINGLE_OUT',
    notes: 'Schnuppermodus, first league prep.',
    currentAverage: 47,
    checkoutPercentage: 22,
    pressurePerformanceIndex: 52,
    total180s: 1,
    avatarUrl: '',
  },
  {
    id: 'seed-ben',
    displayName: 'Ben Albrecht',
    membershipStatus: 'TRIAL',
    preferredCheckoutMode: 'DOUBLE_OUT',
    notes: 'Schnuppermodus, strong on T20 reps.',
    currentAverage: 54,
    checkoutPercentage: 25,
    pressurePerformanceIndex: 57,
    total180s: 3,
    avatarUrl: '',
  },
];

export function PlayersPage() {
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

  const persist = (next: ManagedPlayer[]) => {
    setPlayers(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const filtered = useMemo(
    () => players.filter((p) => p.displayName.toLowerCase().includes(query.toLowerCase())),
    [players, query],
  );

  const addPlayer = () => {
    if (!nameInput.trim()) return;
    persist([
      ...players,
      {
        id: `p-${crypto.randomUUID().slice(0, 8)}`,
        displayName: nameInput.trim(),
        membershipStatus: statusInput,
        preferredCheckoutMode: modeInput,
        notes: '',
        currentAverage: 50,
        checkoutPercentage: 20,
        pressurePerformanceIndex: 50,
        total180s: 0,
        avatarUrl: '',
      },
    ]);
    setNameInput('');
    setModeInput('DOUBLE_OUT');
    setStatusInput('CLUB_MEMBER');
    setShowModal(false);
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
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Mitglied suchen..."
          className="bg-transparent w-full text-sm outline-none"
        />
      </div>

      <div className="space-y-3">
        {filtered.map((player) => (
          <article key={player.id} className="card-bg border soft-border rounded-xl p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <img src={player.avatarUrl || '/branding/h-town-united-logo-tree.jpg'} className="h-12 w-12 rounded-lg object-cover" />
              <div className="min-w-0">
                <p className="font-semibold truncate">{player.displayName}</p>
                <p className="text-xs muted-text">Ø {player.currentAverage} · {player.checkoutPercentage}% Siege · {player.total180s}x 180</p>
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
              <button onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Vor- und Nachname"
              className="w-full rounded-xl bg-slate-800 border border-sky-400/60 p-3"
            />
            <select
              value={modeInput}
              onChange={(e) => setModeInput(e.target.value as CheckoutMode)}
              className="w-full rounded-xl bg-slate-800 p-3"
            >
              <option value="SINGLE_OUT">Single Out</option>
              <option value="DOUBLE_OUT">Double Out</option>
              <option value="MASTER_OUT">Master Out</option>
            </select>
            <select value={statusInput} onChange={(e) => setStatusInput(e.target.value as MembershipStatus)} className="w-full rounded-xl bg-slate-800 p-3">
              <option value="CLUB_MEMBER">Vereinsmitglied</option>
              <option value="TRIAL">Schnuppermodus</option>
            </select>
            <button onClick={addPlayer} className="w-full rounded-xl bg-sky-400 text-slate-900 font-semibold p-3">Mitglied hinzufügen</button>
          </div>
        </div>
      )}
    </section>
  );
}
