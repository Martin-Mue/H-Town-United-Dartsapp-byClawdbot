import { describe, expect, it } from 'vitest';
import { RoundRobinFixtureService } from '../../src/contexts/league/domain/services/RoundRobinFixtureService.js';

describe('RoundRobinFixtureService', () => {
  it('generates fixtures for every round without byes in output', () => {
    const fixtures = new RoundRobinFixtureService().generateFixtures(['a', 'b', 'c', 'd']);

    expect(fixtures.length).toBeGreaterThan(0);
    expect(fixtures.some((fixture) => fixture.homeTeamId === 'BYE' || fixture.awayTeamId === 'BYE')).toBe(false);
  });
});
