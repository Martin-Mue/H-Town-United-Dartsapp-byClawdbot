import { useMemo, useState } from 'react';

type ManagedPlayer = {
  id: string;
  displayName: string;
  preferredCheckoutMode: 'SINGLE_OUT' | 'DOUBLE_OUT' | 'MASTER_OUT';
  notes: string;
};

const STORAGE_KEY = 'htown-players';

/** Lists and manages player profiles and performance context. */
export function PlayersPage() {
  const [players, setPlayers] = useState<ManagedPlayer[]>(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [
        { id: 'p1', displayName: 'Player One', preferredCheckoutMode: 'DOUBLE_OUT', notes: '' },
        { id: 'p2', displayName: 'Player Two', preferredCheckoutMode: 'DOUBLE_OUT', notes: '' },
      ];
    }

    try {
      return JSON.parse(raw) as ManagedPlayer[];
    } catch {
      return [];
    }
  });

  const [nameInput, setNameInput] = useState('');
  const [modeInput, setModeInput] = useState<ManagedPlayer['preferredCheckoutMode']>('DOUBLE_OUT');
  const [notesInput, setNotesInput] = useState('');

  const totalPlayers = useMemo(() => players.length, [players.length]);

  const persist = (nextPlayers: ManagedPlayer[]) => {
    setPlayers(nextPlayers);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextPlayers));
  };

  const addPlayer = () => {
    const displayName = nameInput.trim();
    if (!displayName) return;

    const nextPlayers: ManagedPlayer[] = [
      ...players,
      {
        id: `p-${crypto.randomUUID().slice(0, 8)}`,
        displayName,
        preferredCheckoutMode: modeInput,
        notes: notesInput.trim(),
      },
    ];

    persist(nextPlayers);
    setNameInput('');
    setNotesInput('');
    setModeInput('DOUBLE_OUT');
  };

  const removePlayer = (playerId: string) => {
    persist(players.filter((player) => player.id !== playerId));
  };

  return (
    <section className="space-y-3">
      <div className="rounded-2xl card-bg p-4">
        <h2 className="text-base font-semibold">Player Management</h2>
        <p className="text-xs muted-text mt-1">{totalPlayers} registered players in local club roster</p>
      </div>

      <div className="rounded-2xl card-bg p-4 space-y-2">
        <h3 className="text-sm font-semibold">Add New Player</h3>
        <input
          value={nameInput}
          onChange={(event) => setNameInput(event.target.value)}
          placeholder="Display name"
          className="w-full rounded-xl bg-slate-800 p-2 text-sm"
        />
        <select
          value={modeInput}
          onChange={(event) => setModeInput(event.target.value as ManagedPlayer['preferredCheckoutMode'])}
          className="w-full rounded-xl bg-slate-800 p-2 text-sm"
        >
          <option value="SINGLE_OUT">Single Out</option>
          <option value="DOUBLE_OUT">Double Out</option>
          <option value="MASTER_OUT">Master Out</option>
        </select>
        <textarea
          value={notesInput}
          onChange={(event) => setNotesInput(event.target.value)}
          placeholder="Notes (optional)"
          className="w-full rounded-xl bg-slate-800 p-2 text-sm"
        />
        <button onClick={addPlayer} className="w-full rounded-xl bg-sky-400 p-2 font-semibold text-slate-900">
          Save Player
        </button>
      </div>

      <div className="space-y-2">
        {players.map((player) => (
          <article key={player.id} className="rounded-2xl card-bg p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="font-semibold">{player.displayName}</h4>
                <p className="text-xs muted-text">Preferred checkout: {player.preferredCheckoutMode.replace('_', ' ')}</p>
                {player.notes && <p className="text-xs mt-2">{player.notes}</p>}
              </div>
              <button
                onClick={() => removePlayer(player.id)}
                className="rounded-lg bg-red-900/40 px-2 py-1 text-xs text-red-100"
              >
                Remove
              </button>
            </div>
          </article>
        ))}

        {players.length === 0 && (
          <p className="rounded-xl card-bg p-4 text-sm muted-text">No players yet. Add your first club member above.</p>
        )}
      </div>
    </section>
  );
}
