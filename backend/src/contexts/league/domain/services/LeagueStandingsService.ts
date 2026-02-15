import { LeagueTableEntry } from '../entities/LeagueTableEntry.js';

/** Calculates standings for internal and cross-club league competitions. */
export class LeagueStandingsService {
  /** Builds sorted league table from played fixtures. */
  public calculateTable(input: {
    teams: Array<{ teamId: string; teamName: string }>;
    fixtures: Array<{
      homeTeamId: string;
      awayTeamId: string;
      homeLegs: number;
      awayLegs: number;
      isFinished: boolean;
    }>;
  }): LeagueTableEntry[] {
    const table = new Map<string, LeagueTableEntry>();
    for (const team of input.teams) {
      table.set(team.teamId, new LeagueTableEntry(team.teamId, team.teamName));
    }

    for (const fixture of input.fixtures.filter((entry) => entry.isFinished)) {
      const home = table.get(fixture.homeTeamId);
      const away = table.get(fixture.awayTeamId);
      if (!home || !away) continue;

      home.applyResult({ legsFor: fixture.homeLegs, legsAgainst: fixture.awayLegs });
      away.applyResult({ legsFor: fixture.awayLegs, legsAgainst: fixture.homeLegs });
    }

    return [...table.values()].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.legDifference !== a.legDifference) return b.legDifference - a.legDifference;
      return b.wins - a.wins;
    });
  }
}
