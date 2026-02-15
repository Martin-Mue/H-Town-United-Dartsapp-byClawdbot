export type ManagedPlayer = {
  id: string;
  displayName: string;
  membershipStatus?: 'CLUB_MEMBER' | 'TRIAL';
  currentAverage?: number;
  checkoutPercentage?: number;
  pressurePerformanceIndex?: number;
  total180s?: number;
};

export type EloEntry = { playerId: string; rating: number };

export type HistoryEntry = {
  id: string;
  playedAt: string;
  mode: string;
  players: Array<{ id: string; name: string }>;
  winnerPlayerId: string | null;
  winnerName: string | null;
  resultLabel: string;
};

export type TournamentStateLite = {
  championPlayerId: string | null;
  isCompleted: boolean;
};

export type RankingMetric = 'ELO' | 'MATCH_WINS' | 'TOURNAMENT_WINS' | 'WIN_STREAK' | 'BADGES';

export type PlayerRankingStats = {
  playerId: string;
  displayName: string;
  elo: number;
  matchWins: number;
  tournamentWins: number;
  bestWinStreak: number;
  badges: string[];
};

const norm = (v: string | null | undefined) => (v ?? '').trim().toLowerCase();

function winnerMatchesPlayer(player: ManagedPlayer, match: HistoryEntry): boolean {
  const playerId = norm(player.id);
  const playerName = norm(player.displayName);
  return norm(match.winnerPlayerId) === playerId || norm(match.winnerName) === playerName;
}

function championMatchesPlayer(player: ManagedPlayer, champion: string | null): boolean {
  const playerId = norm(player.id);
  const playerName = norm(player.displayName);
  return norm(champion) === playerId || norm(champion) === playerName;
}

export function computePlayerRankingStats(
  players: ManagedPlayer[],
  elo: EloEntry[],
  history: HistoryEntry[],
  tournaments: TournamentStateLite[],
): PlayerRankingStats[] {
  const eloMap = new Map(elo.map((e) => [norm(e.playerId), e.rating]));

  return players.map((player) => {
    const playerMatches = history.filter((m) => m.players.some((p) => norm(p.id) === norm(player.id) || norm(p.name) === norm(player.displayName)));
    const matchWins = playerMatches.filter((m) => winnerMatchesPlayer(player, m)).length;

    const completed = tournaments.filter((t) => t.isCompleted);
    const tournamentWins = completed.filter((t) => championMatchesPlayer(player, t.championPlayerId)).length;

    let bestWinStreak = 0;
    let streak = 0;
    const sorted = [...playerMatches].sort((a, b) => new Date(a.playedAt).getTime() - new Date(b.playedAt).getTime());
    for (const match of sorted) {
      if (winnerMatchesPlayer(player, match)) {
        streak += 1;
        bestWinStreak = Math.max(bestWinStreak, streak);
      } else {
        streak = 0;
      }
    }

    const badges: string[] = [];
    if (tournamentWins >= 1) badges.push('Turniersieger');
    if (tournamentWins >= 3) badges.push('Titelmaschine');
    if (bestWinStreak >= 3) badges.push('Hot Streak');
    if (bestWinStreak >= 7) badges.push('Unstoppable');
    if (matchWins >= 10) badges.push('Match Hunter');
    if (matchWins >= 25) badges.push('Club Legende');

    return {
      playerId: player.id,
      displayName: player.displayName,
      elo: eloMap.get(norm(player.id)) ?? eloMap.get(norm(player.displayName)) ?? 1200,
      matchWins,
      tournamentWins,
      bestWinStreak,
      badges,
    };
  });
}

export function sortByMetric(entries: PlayerRankingStats[], metric: RankingMetric): PlayerRankingStats[] {
  const points = (row: PlayerRankingStats) => {
    if (metric === 'MATCH_WINS') return row.matchWins;
    if (metric === 'TOURNAMENT_WINS') return row.tournamentWins;
    if (metric === 'WIN_STREAK') return row.bestWinStreak;
    if (metric === 'BADGES') return row.badges.length;
    return row.elo;
  };

  return [...entries].sort((a, b) => points(b) - points(a));
}
