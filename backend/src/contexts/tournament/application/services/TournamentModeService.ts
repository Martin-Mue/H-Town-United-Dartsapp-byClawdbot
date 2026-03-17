import { TournamentAggregate } from '../../domain/aggregates/TournamentAggregate.js';
import { TournamentRound } from '../../domain/entities/TournamentRound.js';
import type { GameMode } from '../../../game/domain/value-objects/GameMode.js';

/** Builds and mutates tournament round mode strategies. */
export class TournamentModeService {
  /** Creates a round-configurable tournament aggregate sample. */
  public createRoundConfigurableTournament(tournamentId: string): TournamentAggregate {
    return new TournamentAggregate(
      tournamentId,
      'Round Configurable Tournament',
      'SINGLE_ELIMINATION',
      {
        byePlacement: 'ROUND_1',
        seedingMode: 'RANDOM',
        defaultLegsPerSet: 3,
        defaultSetsToWin: 2,
        allowRoundModeSwitch: true,
      },
      [
        new TournamentRound(1, 'X01_301', []),
        new TournamentRound(2, 'X01_501', []),
        new TournamentRound(3, 'CUSTOM', []),
      ],
      true,
    );
  }

  /** Applies one round mode override and returns updated mode table. */
  public changeRoundMode(
    tournament: TournamentAggregate,
    roundNumber: number,
    mode: GameMode,
  ): Array<{ roundNumber: number; mode: GameMode }> {
    tournament.setRoundMode(roundNumber, mode);
    return tournament.getRounds().map((round) => ({ roundNumber: round.roundNumber, mode: round.mode }));
  }
}
