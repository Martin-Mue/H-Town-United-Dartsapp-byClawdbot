export type TournamentMatch = {
  id: string;
  home: string;
  away: string;
  winner?: string;
};

export type TournamentRound = {
  roundNumber: number;
  mode: 'X01_301' | 'X01_501' | 'CRICKET' | 'CUSTOM';
  matches: TournamentMatch[];
};

/** Renders tournament bracket with round mode display and winner progression actions. */
export function TournamentBracket({
  rounds,
  onSelectWinner,
}: {
  rounds: TournamentRound[];
  onSelectWinner: (roundNumber: number, matchId: string, winner: string) => void;
}) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {rounds.map((round) => (
        <div key={round.roundNumber} className="min-w-56 space-y-2 rounded-xl card-bg p-3">
          <h3 className="text-sm font-semibold">Round {round.roundNumber}</h3>
          <p className="text-xs muted-text">Mode: {round.mode.replace('_', ' ')}</p>

          {round.matches.map((match) => (
            <div key={match.id} className="rounded-lg bg-slate-800 p-2 text-xs text-slate-200 space-y-2">
              <div className="font-semibold">{match.home} vs {match.away}</div>

              {match.winner ? (
                <div className="rounded bg-emerald-900/40 p-1 text-emerald-200">Winner: {match.winner}</div>
              ) : (
                <div className="grid grid-cols-2 gap-1">
                  <button
                    onClick={() => onSelectWinner(round.roundNumber, match.id, match.home)}
                    className="rounded bg-slate-700 p-1"
                  >
                    {match.home}
                  </button>
                  <button
                    onClick={() => onSelectWinner(round.roundNumber, match.id, match.away)}
                    className="rounded bg-slate-700 p-1"
                  >
                    {match.away}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
