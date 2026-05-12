import { NormalizedTeamStats } from '@/lib/contracts/team-stats';

export interface TeamStrengths {
  attackHome: number;
  defenseHome: number;
  attackAway: number;
  defenseAway: number;
}

export function calculateStrengths(
  homeStats: NormalizedTeamStats,
  awayStats: NormalizedTeamStats
): TeamStrengths {
  const { leagueAverages } = homeStats;

  const lgH = leagueAverages.goalsPerHomeGame;
  const lgA = leagueAverages.goalsPerAwayGame;

  if (lgH <= 0 || lgA <= 0) {
    throw new Error(`Invalid league averages: home=${lgH}, away=${lgA}`);
  }

  const attackHome =
    homeStats.goalsPerGame.home / lgH;

  const defenseHome =
    homeStats.concededPerGame.home / lgH;

  const attackAway =
    awayStats.goalsPerGame.away / lgA;

  const defenseAway =
    awayStats.concededPerGame.away / lgA;

  return { attackHome, defenseHome, attackAway, defenseAway };
}
