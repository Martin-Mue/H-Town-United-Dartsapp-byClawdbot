/** Stores analytical dimensions used for adaptive training and tactical coaching. */
export interface PlayerPerformanceProfile {
  playerId: string;
  averageHistory: number[];
  checkoutHistory: number[];
  pressurePerformanceIndex: number;
  weaknessTags: string[];
  strengthTags: string[];
}
