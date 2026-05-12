import { describe, it, expect } from 'vitest';
import { deriveMatchProbabilities } from '@/lib/model/match-probabilities';
import { calculateStrengths } from '@/lib/model/strength';
import { calculateExpectedGoals } from '@/lib/model/expected-goals';
import { buildScoreMatrix } from '@/lib/model/poisson';
import { runModel } from '@/lib/model/index';
import { NormalizedTeamStats } from '@/lib/contracts/team-stats';

const leagueAverages = { goalsPerHomeGame: 1.5, goalsPerAwayGame: 1.1 };

function makeStats(
  goalsHome: number,
  gamesHome: number,
  concHome: number,
  goalsAway: number,
  gamesAway: number,
  concAway: number
): NormalizedTeamStats {
  return {
    teamId: 'test',
    season: 2026,
    competitionsIncluded: ['LIGA_MX'],
    primaryCompetition: 'LIGA_MX',
    gamesPlayed: { home: gamesHome, away: gamesAway, total: gamesHome + gamesAway },
    goalsScored: {
      home: goalsHome,
      away: goalsAway,
      total: goalsHome + goalsAway,
    },
    goalsConceded: {
      home: concHome,
      away: concAway,
      total: concHome + concAway,
    },
    goalsPerGame: {
      home: goalsHome / gamesHome,
      away: goalsAway / gamesAway,
      total: (goalsHome + goalsAway) / (gamesHome + gamesAway),
    },
    concededPerGame: {
      home: concHome / gamesHome,
      away: concAway / gamesAway,
      total: (concHome + concAway) / (gamesHome + gamesAway),
    },
    leagueAverages,
    dataQuality: 'SUFFICIENT',
    retrievedAt: new Date(),
  };
}

describe('deriveMatchProbabilities', () => {
  it('home + draw + away ≈ 1', () => {
    const { matrix } = buildScoreMatrix(1.5, 1.0);
    const probs = deriveMatchProbabilities(matrix);
    expect(probs.home + probs.draw + probs.away).toBeCloseTo(1.0, 5);
  });

  it('bttsYes + bttsNo ≈ 1', () => {
    const { matrix } = buildScoreMatrix(1.5, 1.0);
    const probs = deriveMatchProbabilities(matrix);
    expect(probs.bttsYes + probs.bttsNo).toBeCloseTo(1.0, 5);
  });

  it('over25 + under25 ≈ 1', () => {
    const { matrix } = buildScoreMatrix(1.5, 1.0);
    const probs = deriveMatchProbabilities(matrix);
    expect(probs.over25 + probs.under25).toBeCloseTo(1.0, 5);
  });

  it('all probabilities are in [0, 1]', () => {
    const { matrix } = buildScoreMatrix(1.5, 1.0);
    const probs = deriveMatchProbabilities(matrix);
    Object.values(probs).forEach((p) => {
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(1);
    });
  });
});

describe('calculateStrengths', () => {
  it('league-average team has strengths ≈ 1', () => {
    // Home team scores exactly league average at home
    const home = makeStats(
      leagueAverages.goalsPerHomeGame * 10, 10, leagueAverages.goalsPerHomeGame * 10,
      leagueAverages.goalsPerAwayGame * 10, 10, leagueAverages.goalsPerAwayGame * 10
    );
    const away = makeStats(
      leagueAverages.goalsPerHomeGame * 10, 10, leagueAverages.goalsPerHomeGame * 10,
      leagueAverages.goalsPerAwayGame * 10, 10, leagueAverages.goalsPerAwayGame * 10
    );
    const strengths = calculateStrengths(home, away);
    expect(strengths.attackHome).toBeCloseTo(1.0, 3);
    expect(strengths.attackAway).toBeCloseTo(1.0, 3);
  });

  it('strong home attacker has attackHome > 1', () => {
    const home = makeStats(24, 10, 10, 10, 10, 10); // 2.4 goals/game at home vs league 1.5
    const away = makeStats(10, 10, 10, 10, 10, 10);
    const strengths = calculateStrengths(home, away);
    expect(strengths.attackHome).toBeGreaterThan(1);
  });
});

describe('runModel', () => {
  it('produces all expected output fields', () => {
    const home = makeStats(18, 10, 12, 10, 10, 10);
    const away = makeStats(10, 10, 10, 11, 10, 13);
    const output = runModel(home, away);

    expect(output.strengths).toBeDefined();
    expect(output.expectedGoals.lambdaHome).toBeGreaterThan(0);
    expect(output.expectedGoals.lambdaAway).toBeGreaterThan(0);
    expect(output.scoreMatrix.matrix).toHaveLength(7);
    expect(output.probabilities.home + output.probabilities.draw + output.probabilities.away)
      .toBeCloseTo(1.0, 4);
  });
});
