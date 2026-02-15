import { useMemo, useState } from 'react';
import { Search, UserPlus, X } from 'lucide-react';

type CheckoutMode = 'SINGLE_OUT' | 'DOUBLE_OUT' | 'MASTER_OUT';

type ManagedPlayer = {
  id: string;
  displayName: string;
  preferredCheckoutMode: CheckoutMode;
  notes: string;
  currentAverage: number;
  checkoutPercentage: number;
  pressurePerformanceIndex: number;
  total180s: number;
  avatarUrl: string;
};

const STORAGE_KEY = 'htown-players';

export function PlayersPage() {
  const [players, setPlayers] = useState<ManagedPlayer[]>(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as ManagedPlayer[];
    } catch {
      return [];
    }
  });
  const [query, setQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [modeInput, setModeInput] = useState<CheckoutMode>('DOUBLE_OUT');

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
            <span className="text-[10px] rounded bg-slate-800 px-2 py-1 muted-text">{player.preferredCheckoutMode.replace('_', ' ')}</span>
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
            <button onClick={addPlayer} className="w-full rounded-xl bg-sky-400 text-slate-900 font-semibold p-3">Mitglied hinzufügen</button>
          </div>
        </div>
      )}
    </section>
  );
}
