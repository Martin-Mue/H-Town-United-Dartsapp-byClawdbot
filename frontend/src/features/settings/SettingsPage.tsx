import { useState } from 'react';
import { useThemeMode } from '../../app/providers/ThemeProvider';

/** Handles account-level preferences and destructive user actions. */
export function SettingsPage() {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [voicePack, setVoicePack] = useState('Classic Arena');
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const { mode, toggleMode } = useThemeMode();

  return (
    <section className="space-y-3">
      <div className="rounded-2xl bg-panel p-4 space-y-3">
        <h3 className="font-semibold">Experience</h3>
        <label className="text-sm text-slate-300 block">Caller Voice Pack</label>
        <select
          value={voicePack}
          onChange={(event) => setVoicePack(event.target.value)}
          className="w-full rounded-lg bg-slate-800 p-2 text-sm"
        >
          <option>Classic Arena</option>
          <option>Pro Championship</option>
          <option>H-Town Signature</option>
        </select>

        <button
          onClick={() => setHapticsEnabled((value) => !value)}
          className="w-full rounded-lg bg-slate-800 p-2 text-sm text-left"
        >
          Haptic Feedback: <span className="font-semibold text-accent">{hapticsEnabled ? 'Enabled' : 'Disabled'}</span>
        </button>

        <button onClick={toggleMode} className="w-full rounded-lg bg-slate-800 p-2 text-sm text-left">
          Theme Mode: <span className="font-semibold text-accent">{mode === 'dark' ? 'Dark' : 'Light'}</span>
        </button>
      </div>

      <button className="w-full rounded-xl bg-red-800 p-3 font-medium" onClick={() => setConfirmDelete(true)}>
        Delete Account
      </button>

      {confirmDelete && (
        <div className="rounded-xl border border-red-400/30 bg-red-950/50 p-4">
          <p className="mb-3 text-sm text-red-100">Are you sure you want to permanently delete this account?</p>
          <div className="flex gap-2">
            <button className="flex-1 rounded-lg bg-slate-700 p-2" onClick={() => setConfirmDelete(false)}>
              Cancel
            </button>
            <button className="flex-1 rounded-lg bg-red-700 p-2">Confirm Delete</button>
          </div>
        </div>
      )}
    </section>
  );
}
