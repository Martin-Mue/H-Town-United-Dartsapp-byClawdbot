import { useEffect, useState } from 'react';
import { TournamentBracket, type TournamentRound } from '../../components/tournament/TournamentBracket';
import { TournamentApiClient, type RoundMode } from '../../services/TournamentApiClient';

const tournamentApiClient = new TournamentApiClient('http://localhost:8080');

/** Shows tournament overview with round modes and backend-driven bracket progression. */
export function TournamentsPage() {
  const [tournamentId, setTournamentId] = useState<string>('');
  const [rounds, setRounds] = useState<TournamentRound[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refresh = async () => {
    try {
      setErrorMessage(null);
      const tournaments = await tournamentApiClient.listTournaments();
      if (tournaments.length === 0) return;
      const selected = tournaments[0];
      setTournamentId(selected.tournamentId);
      setRounds(selected.rounds.map((round) => ({
        roundNumber: round.roundNumber,
        mode: round.mode,
        matches: round.fixtures,
      })));
    } catch {
      setErrorMessage('Tournament backend unavailable. Start backend to enable full bracket flow.');
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const setRoundMode = async (roundNumber: number, mode: RoundMode) => {
    if (!tournamentId) return;
    const updated = await tournamentApiClient.setRoundMode(tournamentId, roundNumber, mode);
    setRounds(updated.rounds.map((round) => ({ roundNumber: round.roundNumber, mode: round.mode, matches: round.fixtures })));
  };

  const onSelectWinner = async (roundNumber: number, fixtureIndex: number, winner: string) => {
    if (!tournamentId) return;
    const updated = await tournamentApiClient.recordWinner(tournamentId, roundNumber, fixtureIndex, winner);
    setRounds(updated.rounds.map((round) => ({ roundNumber: round.roundNumber, mode: round.mode, matches: round.fixtures })));
  };

  return (
    <section className="space-y-3">
      <div className="rounded-2xl card-bg p-4 flex items-center gap-3">
        <img src="/branding/h-town-united-logo-tree.jpg" alt="H-Town logo" className="h-10 w-10 rounded-full border border-slate-500 object-cover" />
        <span>Tournament mode with backend persistence and winner auto-progression</span>
      </div>

      <div className="rounded-2xl card-bg p-4 space-y-2">
        <h3 className="text-sm font-semibold">Round Mode Configuration</h3>
        {rounds.map((round) => (
          <div key={round.roundNumber} className="grid grid-cols-2 gap-2 items-center text-xs">
            <span>Round {round.roundNumber}</span>
            <select
              value={round.mode}
              onChange={(event) => setRoundMode(round.roundNumber, event.target.value as RoundMode)}
              className="rounded bg-slate-800 p-1"
            >
              <option value="X01_301">301</option>
              <option value="X01_501">501</option>
              <option value="CRICKET">Cricket</option>
              <option value="CUSTOM">Custom</option>
            </select>
          </div>
        ))}
      </div>

      {errorMessage && <p className="rounded-xl bg-amber-900/40 p-3 text-xs text-amber-100">{errorMessage}</p>}

      <TournamentBracket rounds={rounds} onSelectWinner={onSelectWinner} />

      <button onClick={refresh} className="w-full rounded-xl bg-slate-800 p-3 text-sm text-slate-200">Refresh Tournament</button>
    </section>
  );
}
