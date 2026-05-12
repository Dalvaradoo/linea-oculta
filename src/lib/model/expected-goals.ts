import { TeamStrengths } from './strength';
import { LeagueAverages } from '@/lib/contracts/team-stats';

export interface ExpectedGoals {
  lambdaHome: number;
  lambdaAway: number;
}

export function calculateExpectedGoals(
  strengths: TeamStrengths,
  leagueAverages: LeagueAverages
): ExpectedGoals {
  const lambdaHome =
    strengths.attackHome * strengths.defenseAway * leagueAverages.goalsPerHomeGame;

  const lambdaAway =
    strengths.attackAway * strengths.defenseHome * leagueAverages.goalsPerAwayGame;

  return { lambdaHome, lambdaAway };
}
