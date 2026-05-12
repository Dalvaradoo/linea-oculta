import { NormalizedTeamStats } from '@/lib/contracts/team-stats';
import { calculateStrengths, TeamStrengths } from './strength';
import { calculateExpectedGoals, ExpectedGoals } from './expected-goals';
import { buildScoreMatrix, ScoreMatrix } from './poisson';
import { deriveMatchProbabilities, MatchProbabilities } from './match-probabilities';

export interface ModelOutput {
  strengths: TeamStrengths;
  expectedGoals: ExpectedGoals;
  scoreMatrix: ScoreMatrix;
  probabilities: MatchProbabilities;
}

export function runModel(
  homeStats: NormalizedTeamStats,
  awayStats: NormalizedTeamStats
): ModelOutput {
  const strengths = calculateStrengths(homeStats, awayStats);
  const expectedGoals = calculateExpectedGoals(strengths, homeStats.leagueAverages);
  const scoreMatrix = buildScoreMatrix(expectedGoals.lambdaHome, expectedGoals.lambdaAway);
  const probabilities = deriveMatchProbabilities(scoreMatrix.matrix);

  return { strengths, expectedGoals, scoreMatrix, probabilities };
}

export { calculateStrengths } from './strength';
export { calculateExpectedGoals } from './expected-goals';
export { buildScoreMatrix, poissonPMF } from './poisson';
export { deriveMatchProbabilities } from './match-probabilities';
export type { TeamStrengths, ExpectedGoals, ScoreMatrix, MatchProbabilities };
