import { useState } from 'react';
import { useThemeMode } from '../../app/providers/ThemeProvider';

/** Handles app preferences and account/privacy controls. */
export function SettingsPage() {
  const { mode, toggleMode } = useThemeMode();
  const [voicePack, setVoicePack] = useState('H-Town Signature');
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [cameraOverlay, setCameraOverlay] = useState(true);
  const [autoSuggestScore, setAutoSuggestScore] = useState(true);
  const [quickCheckoutHints, setQuickCheckoutHints] = useState(true);
  const [matchAnnouncer, setMatchAnnouncer] = useState(true);
  const [defaultGameMode, setDefaultGameMode] = useState('X01_501');
  const [privacyMode, setPrivacyMode] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <section className="space-y-4 animate-[fadeIn_.25s_ease]">
      <div className="hero-gradient rounded-2xl border soft-border p-4">
        <h2 className="text-xl uppercase">Einstellungen</h2>
        <p className="text-xs muted-text mt-1">Geräteeinstellungen, Match-UX, Kamera und Datenschutz.</p>
      </div>

      <div className="rounded-2xl card-bg border soft-border p-4 space-y-3">
        <h3 className="text-sm uppercase">Erlebnis</h3>
        <label className="text-xs muted-text block">Caller Voice Pack</label>
        <select value={voicePack} onChange={(event) => setVoicePack(event.target.value)} className="w-full rounded-lg bg-slate-800 p-2 text-sm">
          <option>Classic Arena</option>
          <option>Pro Championship</option>
          <option>H-Town Signature</option>
        </select>

        <ToggleRow label="Haptic Feedback" value={hapticsEnabled} onToggle={() => setHapticsEnabled((v) => !v)} />
        <ToggleRow label="Match Announcer" value={matchAnnouncer} onToggle={() => setMatchAnnouncer((v) => !v)} />
        <ToggleRow label="Checkout Hints" value={quickCheckoutHints} onToggle={() => setQuickCheckoutHints((v) => !v)} />
      </div>

      <div className="rounded-2xl card-bg border soft-border p-4 space-y-3">
        <h3 className="text-sm uppercase">Spiel Standard</h3>
        <label className="text-xs muted-text block">Default Modus</label>
        <select value={defaultGameMode} onChange={(event) => setDefaultGameMode(event.target.value)} className="w-full rounded-lg bg-slate-800 p-2 text-sm">
          <option value="X01_301">301</option>
          <option value="X01_501">501</option>
          <option value="CRICKET">Cricket</option>
          <option value="CUSTOM">Custom</option>
        </select>
        <button onClick={toggleMode} className="w-full rounded-lg bg-slate-800 p-2 text-sm text-left">
          Theme Mode: <span className="font-semibold primary-text">{mode === 'dark' ? 'Dark' : 'Light'}</span>
        </button>
      </div>

      <div className="rounded-2xl card-bg border soft-border p-4 space-y-3">
        <h3 className="text-sm uppercase">Kamera & KI</h3>
        <ToggleRow label="Kamera Overlay" value={cameraOverlay} onToggle={() => setCameraOverlay((v) => !v)} />
        <ToggleRow label="Auto Score-Vorschlag" value={autoSuggestScore} onToggle={() => setAutoSuggestScore((v) => !v)} />
      </div>

      <div className="rounded-2xl card-bg border soft-border p-4 space-y-3">
        <h3 className="text-sm uppercase">Datenschutz</h3>
        <ToggleRow label="Privacy Mode (anonyme Namen in Listen)" value={privacyMode} onToggle={() => setPrivacyMode((v) => !v)} />
      </div>

      <button className="w-full rounded-xl bg-red-800 p-3 font-medium" onClick={() => setConfirmDelete(true)}>
        Account löschen
      </button>

      {confirmDelete && (
        <div className="rounded-xl border border-red-400/30 bg-red-950/50 p-4">
          <p className="mb-3 text-sm text-red-100">Willst du diesen Account wirklich dauerhaft löschen?</p>
          <div className="flex gap-2">
            <button className="flex-1 rounded-lg bg-slate-700 p-2" onClick={() => setConfirmDelete(false)}>
              Abbrechen
            </button>
            <button className="flex-1 rounded-lg bg-red-700 p-2">Löschen bestätigen</button>
          </div>
        </div>
      )}
    </section>
  );
}

function ToggleRow({ label, value, onToggle }: { label: string; value: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className="w-full rounded-lg bg-slate-800 p-2 text-sm text-left flex items-center justify-between">
      <span>{label}</span>
      <span className={`text-xs font-semibold ${value ? 'text-emerald-300' : 'text-slate-400'}`}>{value ? 'AN' : 'AUS'}</span>
    </button>
  );
}
