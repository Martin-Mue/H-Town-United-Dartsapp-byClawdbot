import { useState } from 'react';
import { TournamentBracket, type TournamentRound } from '../../components/tournament/TournamentBracket';

const initialRounds: TournamentRound[] = [
  {
    roundNumber: 1,
    mode: 'X01_301',
    matches: [
      { id: 'r1m1', home: 'Player A', away: 'Player B' },
      { id: 'r1m2', home: 'Player C', away: 'Player D' },
    ],
  },
  {
    roundNumber: 2,
    mode: 'X01_501',
    matches: [{ id: 'r2m1', home: 'TBD', away: 'TBD' }],
  },
  {
    roundNumber: 3,
    mode: 'CUSTOM',
    matches: [{ id: 'r3m1', home: 'TBD', away: 'TBD' }],
  },
];

/** Shows tournament overview with round modes and bracket auto-progression. */
export function TournamentsPage() {
  const [rounds, setRounds] = useState<TournamentRound[]>(initialRounds);

  const setRoundMode = (roundNumber: number, mode: TournamentRound['mode']) => {
    setRounds((prev) => prev.map((round) => (round.roundNumber === roundNumber ? { ...round, mode } : round)));
  };

  const onSelectWinner = (roundNumber: number, matchId: string, winner: string) => {
    setRounds((prev) => {
      const next = prev.map((round) => ({ ...round, matches: round.matches.map((m) => ({ ...m })) }));
      const currentRound = next.find((entry) => entry.roundNumber === roundNumber);
      if (!currentRound) return prev;

      const currentMatch = currentRound.matches.find((entry) => entry.id === matchId);
      if (!currentMatch || currentMatch.winner) return prev;
      currentMatch.winner = winner;

      const nextRound = next.find((entry) => entry.roundNumber === roundNumber + 1);
      if (nextRound) {
        const winners = currentRound.matches.map((entry) => entry.winner).filter(Boolean) as string[];
        if (winners.length >= 2) {
          nextRound.matches[0].home = winners[0];
          nextRound.matches[0].away = winners[1];
        } else if (winners.length === 1) {
          nextRound.matches[0].home = winners[0];
        }
      }

      return next;
    });
  };

  return (
    <section className="space-y-3">
      <div className="rounded-2xl card-bg p-4 flex items-center gap-3">
        <img src="/branding/h-town-united-logo-tree.jpg" alt="H-Town logo" className="h-10 w-10 rounded-full border border-slate-500 object-cover" />
        <span>Tournament mode with round-based game variants and auto-progression</span>
      </div>

      <div className="rounded-2xl card-bg p-4 space-y-2">
        <h3 className="text-sm font-semibold">Round Mode Configuration</h3>
        {rounds.map((round) => (
          <div key={round.roundNumber} className="grid grid-cols-2 gap-2 items-center text-xs">
            <span>Round {round.roundNumber}</span>
            <select
              value={round.mode}
              onChange={(event) => setRoundMode(round.roundNumber, event.target.value as TournamentRound['mode'])}
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

      <TournamentBracket rounds={rounds} onSelectWinner={onSelectWinner} />

      <div className="rounded-2xl card-bg p-4">
        <h3 className="text-sm font-semibold mb-2">League Standings Snapshot</h3>
        <div className="space-y-2 text-sm">
          <StandingRow rank={1} team="H-Town Aces" points={27} />
          <StandingRow rank={2} team="Double Masters" points={24} />
          <StandingRow rank={3} team="Bullseye Bros" points={21} />
        </div>
      </div>
    </section>
  );
}

function StandingRow({ rank, team, points }: { rank: number; team: string; points: number }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-slate-800 p-2">
      <span className="text-slate-300">#{rank} {team}</span>
      <span className="font-semibold text-accent">{points} pts</span>
    </div>
  );
}
