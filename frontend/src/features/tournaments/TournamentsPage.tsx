import { TournamentBracket } from '../../components/tournament/TournamentBracket';

/** Shows tournament overview with auto-refresh-ready bracket visualizations. */
export function TournamentsPage() {
  return (
    <section className="space-y-3">
      <div className="rounded-2xl bg-panel p-4">Club and cross-club tournaments</div>
      <TournamentBracket />
    </section>
  );
}
