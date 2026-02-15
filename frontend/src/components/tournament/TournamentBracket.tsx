export type TournamentMatch = {
  homePlayerId: string;
  awayPlayerId: string;
  winnerPlayerId?: string;
  resultLabel?: string;
  linkedMatchId?: string;
};

export type TournamentRound = {
  roundNumber: number;
  mode: 'X01_301' | 'X01_501' | 'CRICKET' | 'CUSTOM';
  matches: TournamentMatch[];
};

/** Adaptive tournament bracket with winner/result display and per-fixture match launch action. */
export function TournamentBracket({
  rounds,
  onSelectWinner,
  onStartMatch,
}: {
  rounds: TournamentRound[];
  onSelectWinner: (roundNumber: number, fixtureIndex: number, winner: string, resultLabel?: string) => void;
  onStartMatch: (roundNumber: number, fixtureIndex: number) => void;
}) {
  const expectedPerRound = deriveExpectedMatchCounts(rounds);
  const cardHeightPx = 148;
  const rowGapPx = 12;

  return (
    <div className="overflow-x-auto pb-3">
      <div className="flex items-start gap-8 min-w-max">
        {rounds.map((round, roundIndex) => {
          const expectedCount = expectedPerRound[roundIndex] ?? round.matches.length;
          const paddedMatches = Array.from({ length: expectedCount }, (_, idx) =>
            round.matches[idx] ?? { homePlayerId: 'TBD', awayPlayerId: 'TBD' },
          );

          const step = 2 ** roundIndex;
          const base = cardHeightPx + rowGapPx;
          const columnGapPx = Math.max(rowGapPx, step * base - cardHeightPx);
          const matchMarginTop = roundIndex === 0 ? 12 : ((step - 1) * base) / 2 + 12;

          return (
            <div key={round.roundNumber} className="w-[300px]">
              <div className="rounded-xl border soft-border hero-gradient p-3">
                <p className="text-sm font-semibold uppercase">Round {round.roundNumber}</p>
                <p className="text-[11px] muted-text">Mode: {round.mode.replace('_', ' ')}</p>
              </div>

              <div style={{ marginTop: `${matchMarginTop}px`, display: 'flex', flexDirection: 'column', gap: `${columnGapPx}px` }}>
              {paddedMatches.map((match, fixtureIndex) => {
                const playable = !['BYE', 'TBD'].includes(match.homePlayerId) && !['BYE', 'TBD'].includes(match.awayPlayerId);
                return (
                  <div key={`${round.roundNumber}-${fixtureIndex}`} className="relative h-[148px] rounded-xl border soft-border card-bg p-3 flex flex-col justify-between">
                    <div className="space-y-1 text-xs">
                      <PlayerLine name={match.homePlayerId} winner={match.winnerPlayerId === match.homePlayerId} />
                      <PlayerLine name={match.awayPlayerId} winner={match.winnerPlayerId === match.awayPlayerId} />
                    </div>

                    {match.winnerPlayerId ? (
                      <p className="mt-2 rounded bg-emerald-900/40 px-2 py-1 text-[11px] text-emerald-200">
                        Ergebnis: {match.winnerPlayerId}{match.resultLabel ? ` (${match.resultLabel})` : ''}
                      </p>
                    ) : (
                      <>
                        <div className="mt-2 grid grid-cols-2 gap-1">
                          <button
                            onClick={() => onSelectWinner(round.roundNumber, fixtureIndex, match.homePlayerId)}
                            disabled={!playable}
                            className="rounded bg-slate-800 p-1 text-[11px] disabled:opacity-40"
                          >
                            {match.homePlayerId}
                          </button>
                          <button
                            onClick={() => onSelectWinner(round.roundNumber, fixtureIndex, match.awayPlayerId)}
                            disabled={!playable}
                            className="rounded bg-slate-800 p-1 text-[11px] disabled:opacity-40"
                          >
                            {match.awayPlayerId}
                          </button>
                        </div>
                        {playable && (
                          <button onClick={() => onStartMatch(round.roundNumber, fixtureIndex)} className="mt-2 w-full rounded bg-sky-400 p-1.5 text-[11px] font-semibold text-slate-900">
                            Match starten
                          </button>
                        )}
                      </>
                    )}

                    {roundIndex > 0 && <div className="pointer-events-none absolute -left-16 top-1/2 h-px w-16 bg-slate-600" />}
                    {roundIndex < rounds.length - 1 && <div className="pointer-events-none absolute -right-16 top-1/2 h-px w-16 bg-slate-600" />}
                    {roundIndex < rounds.length - 1 && fixtureIndex % 2 === 0 && fixtureIndex + 1 < paddedMatches.length && (
                      <div
                        className="pointer-events-none absolute -right-16 top-1/2 w-px bg-slate-500"
                        style={{ height: `${cardHeightPx + columnGapPx}px` }}
                      />
                    )}
                  </div>
                );
              })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function deriveExpectedMatchCounts(rounds: TournamentRound[]): number[] {
  if (rounds.length === 0) return [];
  const firstRoundCount = Math.max(1, rounds[0].matches.length);
  const counts: number[] = [firstRoundCount];
  for (let i = 1; i < rounds.length; i += 1) {
    counts.push(Math.max(1, Math.ceil(counts[i - 1] / 2)));
  }
  return counts;
}

function PlayerLine({ name, winner }: { name: string; winner: boolean }) {
  return <div className={`rounded p-1 ${winner ? 'bg-emerald-900/30 text-emerald-200' : 'bg-slate-800'}`}>{name}</div>;
}
