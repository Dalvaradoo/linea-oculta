import { describe, it, expect } from 'vitest';
import { calculateEdge } from '@/lib/evaluation/edge';
import { assignLabel } from '@/lib/evaluation/labels';
import { assessConfidence } from '@/lib/evaluation/confidence';
import { checkGuardrails } from '@/lib/evaluation/guardrails';
import { GuardrailFlags } from '@/lib/contracts/pick';
import { OddsMarket } from '@/lib/contracts/odds';

const noFlags: GuardrailFlags = {
  insufficientData: false,
  highRiskEdge: false,
  marketModelDivergence: false,
  oddsNotAvailable: false,
  incompleteMarket: false,
  staleData: false,
  wcLimitedData: false,
};

const completeMarket: OddsMarket = {
  type: 'MATCH_WINNER',
  selections: [
    { label: 'Home', odds: 2.10, impliedProbability: 0.476, fairProbability: 0.454 },
    { label: 'Draw', odds: 3.40, impliedProbability: 0.294, fairProbability: 0.281 },
    { label: 'Away', odds: 3.60, impliedProbability: 0.278, fairProbability: 0.265 },
  ],
  overround: 0.048,
};

describe('calculateEdge', () => {
  it('positive edge: model > fair', () => {
    const { edge, edgePct } = calculateEdge(0.512, 0.454);
    expect(edge).toBeCloseTo(0.058, 3);
    expect(edgePct).toBeCloseTo(12.78, 1);
  });

  it('negative edge: model < fair', () => {
    const { edgePct } = calculateEdge(0.30, 0.454);
    expect(edgePct).toBeLessThan(0);
  });

  it('zero edge when model = fair', () => {
    const { edge, edgePct } = calculateEdge(0.454, 0.454);
    expect(edge).toBeCloseTo(0, 5);
    expect(edgePct).toBeCloseTo(0, 5);
  });

  it('throws when fairProbability is 0', () => {
    expect(() => calculateEdge(0.5, 0)).toThrow();
  });
});

describe('assignLabel', () => {
  it('VALUE when edgePct > 5 and no guardrails', () => {
    expect(assignLabel(12, noFlags)).toBe('VALUE');
  });

  it('LEAN when 2 < edgePct ≤ 5', () => {
    expect(assignLabel(3.5, noFlags)).toBe('LEAN');
  });

  it('FAIR when -2 ≤ edgePct ≤ 2', () => {
    expect(assignLabel(1.0, noFlags)).toBe('FAIR');
    expect(assignLabel(-1.5, noFlags)).toBe('FAIR');
  });

  it('AVOID when edgePct < -2', () => {
    expect(assignLabel(-5, noFlags)).toBe('AVOID');
  });

  it('AVOID when VALUE edge but guardrail active', () => {
    const flags = { ...noFlags, highRiskEdge: true };
    expect(assignLabel(30, flags)).toBe('AVOID');
  });

  it('guardrails override VALUE', () => {
    expect(assignLabel(100, { ...noFlags, insufficientData: true })).toBe('AVOID');
  });
});

describe('assessConfidence', () => {
  it('HIGH when both teams have ≥ 8 games', () => {
    expect(assessConfidence(10, 10, 'LIGA_MX', 10, { highRiskEdge: false, marketModelDivergence: false }))
      .toBe('HIGH');
  });

  it('MEDIUM when 4-7 games', () => {
    expect(assessConfidence(6, 6, 'LIGA_MX', 6, { highRiskEdge: false, marketModelDivergence: false }))
      .toBe('MEDIUM');
  });

  it('LOW when < 4 games', () => {
    expect(assessConfidence(2, 10, 'LIGA_MX', 2, { highRiskEdge: false, marketModelDivergence: false }))
      .toBe('LOW');
  });

  it('HIGH downgraded to MEDIUM by highRiskEdge', () => {
    expect(assessConfidence(10, 10, 'LIGA_MX', 10, { highRiskEdge: true, marketModelDivergence: false }))
      .toBe('MEDIUM');
  });

  it('MEDIUM downgraded to LOW by marketModelDivergence', () => {
    expect(assessConfidence(6, 6, 'LIGA_MX', 6, { highRiskEdge: false, marketModelDivergence: true }))
      .toBe('LOW');
  });

  it('WC caps at MEDIUM even with 10+ games', () => {
    expect(assessConfidence(10, 10, 'WC_2026', 5, { highRiskEdge: false, marketModelDivergence: false }))
      .toBe('MEDIUM');
  });

  it('WC with ≥ 10 gamesUsed can reach HIGH', () => {
    expect(assessConfidence(10, 10, 'WC_2026', 10, { highRiskEdge: false, marketModelDivergence: false }))
      .toBe('HIGH');
  });
});

describe('checkGuardrails', () => {
  const base = {
    oddsAvailable: true,
    homeGamesPlayed: 10,
    awayGamesPlayed: 10,
    edgePct: 5,
    modelProbability: 0.50,
    fairProbability: 0.46,
    market: completeMarket,
    statsRetrievedAt: new Date(),
    competition: 'LIGA_MX',
    gamesUsed: 10,
  };

  it('no flags for clean input', () => {
    const flags = checkGuardrails(base);
    expect(Object.values(flags).every((v) => v === false)).toBe(true);
  });

  it('flags oddsNotAvailable', () => {
    const flags = checkGuardrails({ ...base, oddsAvailable: false });
    expect(flags.oddsNotAvailable).toBe(true);
  });

  it('flags insufficientData when home < MIN_GAMES_THRESHOLD', () => {
    const flags = checkGuardrails({ ...base, homeGamesPlayed: 3 });
    expect(flags.insufficientData).toBe(true);
  });

  it('does NOT flag insufficientData at exactly MIN_GAMES_THRESHOLD (4)', () => {
    const flags = checkGuardrails({ ...base, homeGamesPlayed: 4, awayGamesPlayed: 4 });
    expect(flags.insufficientData).toBe(false);
  });

  it('flags highRiskEdge when |edgePct| > 25', () => {
    const flags = checkGuardrails({ ...base, edgePct: 30 });
    expect(flags.highRiskEdge).toBe(true);
  });

  it('flags incompleteMarket when market has fewer selections than expected', () => {
    const partial: OddsMarket = {
      ...completeMarket,
      selections: completeMarket.selections.slice(0, 2), // only 2 instead of 3
    };
    const flags = checkGuardrails({ ...base, market: partial });
    expect(flags.incompleteMarket).toBe(true);
  });

  it('flags wcLimitedData for WC with < 10 games', () => {
    const flags = checkGuardrails({ ...base, competition: 'WC_2026', gamesUsed: 7 });
    expect(flags.wcLimitedData).toBe(true);
  });
});
