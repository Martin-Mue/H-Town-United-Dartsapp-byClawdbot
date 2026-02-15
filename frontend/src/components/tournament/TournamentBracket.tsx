/** Renders a simple tournament bracket that can be extended round-by-round. */
export function TournamentBracket() {
  const rounds = [
    ['Player A vs Player B', 'Player C vs Player D'],
    ['Winner QF1 vs Winner QF2'],
    ['Final'],
  ];

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {rounds.map((matches, roundIndex) => (
        <div key={roundIndex} className="min-w-48 space-y-2 rounded-xl bg-panel p-3">
          <h3 className="text-sm font-semibold">Round {roundIndex + 1}</h3>
          {matches.map((match) => (
            <div key={match} className="rounded-lg bg-slate-800 p-2 text-xs text-slate-200">
              {match}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
