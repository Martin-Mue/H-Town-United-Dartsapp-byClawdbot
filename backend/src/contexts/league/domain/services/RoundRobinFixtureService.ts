/** Generates round-robin fixtures for league seasons. */
export class RoundRobinFixtureService {
  /** Generates full single round-robin schedule for provided team ids. */
  public generateFixtures(teamIds: string[]): Array<{ round: number; homeTeamId: string; awayTeamId: string }> {
    const ids = [...teamIds];
    if (ids.length % 2 !== 0) ids.push('BYE');

    const rounds = ids.length - 1;
    const half = ids.length / 2;
    const fixtures: Array<{ round: number; homeTeamId: string; awayTeamId: string }> = [];

    for (let round = 0; round < rounds; round += 1) {
      for (let index = 0; index < half; index += 1) {
        const home = ids[index];
        const away = ids[ids.length - 1 - index];
        if (home !== 'BYE' && away !== 'BYE') {
          fixtures.push({ round: round + 1, homeTeamId: home, awayTeamId: away });
        }
      }

      const fixed = ids[0];
      const rotated = [fixed, ids[ids.length - 1], ...ids.slice(1, ids.length - 1)];
      ids.splice(0, ids.length, ...rotated);
    }

    return fixtures;
  }
}
