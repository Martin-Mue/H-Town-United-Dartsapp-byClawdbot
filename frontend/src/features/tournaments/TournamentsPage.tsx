import { useEffect, useMemo, useState } from 'react';
import { TournamentBracket, type TournamentRound } from '../../components/tournament/TournamentBracket';
import { TournamentApiClient, type RoundMode, type TournamentFormat, type TournamentStateDto } from '../../services/TournamentApiClient';

const tournamentApiClient = new TournamentApiClient('http://localhost:8080');

export function TournamentsPage() {
  const [tournaments, setTournaments] = useState<TournamentStateDto[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('');
  const [name, setName] = useState('H-Town Cup');
  const [format, setFormat] = useState<TournamentFormat>('SINGLE_ELIMINATION');
  const [participantsText, setParticipantsText] = useState('Lukas, Mert, Jonas, Timo');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedTournament = useMemo(
    () => tournaments.find((entry) => entry.tournamentId === selectedTournamentId) ?? tournaments[0],
    [selectedTournamentId, tournaments],
  );

  const rounds: TournamentRound[] = (selectedTournament?.rounds ?? []).map((round) => ({
    roundNumber: round.roundNumber,
    mode: round.mode,
    matches: round.fixtures,
  }));

  const refresh = async () => {
    try {
      setErrorMessage(null);
      const data = await tournamentApiClient.listTournaments();
      setTournaments(data);
      if (!selectedTournamentId && data.length > 0) setSelectedTournamentId(data[0].tournamentId);
    } catch {
      setErrorMessage('Tournament backend unavailable.');
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const createTournament = async () => {
    const participants = participantsText.split(',').map((p) => p.trim()).filter(Boolean);
    if (participants.length < 2) {
      setErrorMessage('Mindestens 2 Teilnehmer angeben.');
      return;
    }

    const created = await tournamentApiClient.createTournament({
      name: name.trim() || 'H-Town Cup',
      format,
      participants,
      roundModes: ['X01_501', 'X01_501', 'X01_501'],
    });

    await refresh();
    setSelectedTournamentId(created.tournamentId);
  };

  const setRoundMode = async (roundNumber: number, mode: RoundMode) => {
    if (!selectedTournament) return;
    const updated = await tournamentApiClient.setRoundMode(selectedTournament.tournamentId, roundNumber, mode);
    setTournaments((prev) => prev.map((entry) => (entry.tournamentId === updated.tournamentId ? updated : entry)));
  };

  const onSelectWinner = async (roundNumber: number, fixtureIndex: number, winner: string) => {
    if (!selectedTournament) return;
    const updated = await tournamentApiClient.recordWinner(selectedTournament.tournamentId, roundNumber, fixtureIndex, winner);
    setTournaments((prev) => prev.map((entry) => (entry.tournamentId === updated.tournamentId ? updated : entry)));
  };

  return (
    <section className="space-y-4 animate-[fadeIn_.25s_ease]">
      <div className="rounded-2xl hero-gradient border soft-border p-4">
        <h2 className="text-xl uppercase">Turniere</h2>
        <p className="text-xs muted-text">Vollständiges Turnierformat, Baum mit Ergebnissen und Vereinshistorie.</p>
      </div>

      <div className="rounded-2xl card-bg border soft-border p-4 space-y-2">
        <h3 className="text-sm uppercase">Neues Turnier</h3>
        <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg bg-slate-800 p-2 text-sm" placeholder="Turniername" />
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => setFormat('SINGLE_ELIMINATION')} className={`rounded-lg p-2 text-xs ${format === 'SINGLE_ELIMINATION' ? 'bg-sky-400 text-slate-900 font-semibold' : 'bg-slate-800'}`}>K.O.</button>
          <button onClick={() => setFormat('ROUND_ROBIN')} className={`rounded-lg p-2 text-xs ${format === 'ROUND_ROBIN' ? 'bg-sky-400 text-slate-900 font-semibold' : 'bg-slate-800'}`}>Round Robin</button>
        </div>
        <textarea value={participantsText} onChange={(e) => setParticipantsText(e.target.value)} className="w-full rounded-lg bg-slate-800 p-2 text-xs" rows={2} placeholder="Teilnehmer, kommagetrennt" />
        <button onClick={createTournament} className="w-full rounded-xl bg-sky-400 p-2 text-sm font-semibold text-slate-900">Turnier erstellen</button>
      </div>

      {selectedTournament && (
        <div className="rounded-2xl card-bg border soft-border p-4 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="font-semibold">{selectedTournament.name}</p>
              <p className="text-xs muted-text">{selectedTournament.format.replace('_', ' ')} · {new Date(selectedTournament.updatedAt).toLocaleString('de-DE')}</p>
            </div>
            {selectedTournament.championPlayerId && <span className="rounded bg-emerald-900/40 px-2 py-1 text-xs text-emerald-200">Sieger: {selectedTournament.championPlayerId}</span>}
          </div>

          {rounds.map((round) => (
            <div key={round.roundNumber} className="grid grid-cols-2 gap-2 items-center text-xs">
              <span>Round {round.roundNumber}</span>
              <select value={round.mode} onChange={(e) => setRoundMode(round.roundNumber, e.target.value as RoundMode)} className="rounded bg-slate-800 p-1">
                <option value="X01_301">301</option>
                <option value="X01_501">501</option>
                <option value="CRICKET">Cricket</option>
                <option value="CUSTOM">Custom</option>
              </select>
            </div>
          ))}
        </div>
      )}

      <TournamentBracket rounds={rounds} onSelectWinner={onSelectWinner} />

      <div className="rounded-2xl card-bg border soft-border p-4 space-y-2">
        <h3 className="text-sm uppercase">Vereinshistorie</h3>
        <div className="space-y-2 max-h-56 overflow-auto">
          {tournaments.map((entry) => (
            <button key={entry.tournamentId} onClick={() => setSelectedTournamentId(entry.tournamentId)} className={`w-full text-left rounded-lg p-2 border ${selectedTournament?.tournamentId === entry.tournamentId ? 'border-sky-400 bg-sky-900/20' : 'soft-border bg-slate-900/40'}`}>
              <p className="text-sm font-semibold">{entry.name}</p>
              <p className="text-xs muted-text">{entry.format.replace('_', ' ')} · {entry.championPlayerId ? `Sieger ${entry.championPlayerId}` : 'Laufend'}</p>
            </button>
          ))}
          {tournaments.length === 0 && <p className="text-xs muted-text">Noch keine Turniere.</p>}
        </div>
      </div>

      {errorMessage && <p className="rounded-xl bg-amber-900/40 p-3 text-xs text-amber-100">{errorMessage}</p>}
    </section>
  );
}
