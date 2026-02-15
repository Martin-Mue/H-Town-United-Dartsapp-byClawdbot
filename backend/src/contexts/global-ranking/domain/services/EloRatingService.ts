/** Calculates ELO rating changes for darts match outcomes. */
export class EloRatingService {
  /** Computes updated winner/loser ratings using configurable K-factor. */
  public calculateNewRatings(
    winnerRating: number,
    loserRating: number,
    kFactor = 32,
  ): { winner: number; loser: number } {
    const winnerExpected = 1 / (1 + 10 ** ((loserRating - winnerRating) / 400));
    const loserExpected = 1 / (1 + 10 ** ((winnerRating - loserRating) / 400));

    return {
      winner: Math.round(winnerRating + kFactor * (1 - winnerExpected)),
      loser: Math.round(loserRating + kFactor * (0 - loserExpected)),
    };
  }
}
