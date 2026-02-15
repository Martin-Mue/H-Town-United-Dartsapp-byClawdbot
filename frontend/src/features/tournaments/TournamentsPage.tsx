import { TournamentBracket } from '../../components/tournament/TournamentBracket';

/** Shows tournament overview with auto-refresh-ready bracket visualizations. */
export function TournamentsPage() {
  return (
    <section className="space-y-3">
      <div className="rounded-2xl bg-panel p-4">Club and cross-club tournaments</div>
      <TournamentBracket />

      <div className="rounded-2xl bg-panel p-4">
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
