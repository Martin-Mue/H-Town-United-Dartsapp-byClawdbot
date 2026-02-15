import { describe, expect, it } from 'vitest';
import { TournamentModeService } from '../../src/contexts/tournament/application/services/TournamentModeService.js';

describe('TournamentModeService', () => {
  it('supports changing one round mode for adaptive tournament structure', () => {
    const service = new TournamentModeService();
    const tournament = service.createRoundConfigurableTournament('t-1');

    const rounds = service.changeRoundMode(tournament, 2, 'CRICKET');

    expect(rounds.find((entry) => entry.roundNumber === 2)?.mode).toBe('CRICKET');
  });
});
