import { useState } from 'react';

/** Handles account-level preferences and destructive user actions. */
export function SettingsPage() {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <section className="space-y-3">
      <div className="rounded-2xl bg-panel p-4">Voice packs, haptics, and notification settings.</div>
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
