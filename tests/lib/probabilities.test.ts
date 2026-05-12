import { describe, it, expect } from 'vitest';
import { decimalToImplied } from '@/lib/probabilities/implied';
import { calculateOverround, sumImplied } from '@/lib/probabilities/overround';
import { calculateFairProbabilities } from '@/lib/probabilities/fair';

describe('decimalToImplied', () => {
  it('converts 2.0 to 0.5', () => {
    expect(decimalToImplied(2.0)).toBeCloseTo(0.5);
  });

  it('converts 1.5 to 0.667', () => {
    expect(decimalToImplied(1.5)).toBeCloseTo(0.6667, 3);
  });

  it('throws on zero odds', () => {
    expect(() => decimalToImplied(0)).toThrow();
  });

  it('throws on negative odds', () => {
    expect(() => decimalToImplied(-1)).toThrow();
  });
});

describe('calculateOverround', () => {
  it('calculates overround for a standard 1X2 market', () => {
    // 2.10 / 3.40 / 3.60 → sum = 1.048 → overround ≈ 4.8%
    const overround = calculateOverround([2.10, 3.40, 3.60]);
    expect(overround).toBeCloseTo(0.048, 2);
  });

  it('returns ~0 for a fair market (no juice)', () => {
    // 2.0 / 2.0 → sum = 1.0 → overround = 0
    const overround = calculateOverround([2.0, 2.0]);
    expect(overround).toBeCloseTo(0, 5);
  });

  it('throws on empty array', () => {
    expect(() => calculateOverround([])).toThrow();
  });
});

describe('calculateFairProbabilities', () => {
  it('removes the juice correctly', () => {
    const result = calculateFairProbabilities([
      { label: 'Home', odds: 2.10 },
      { label: 'Draw', odds: 3.40 },
      { label: 'Away', odds: 3.60 },
    ]);

    expect(result).toHaveLength(3);

    // Fair probs must sum to 1
    const sum = result.reduce((a, r) => a + r.fairProbability, 0);
    expect(sum).toBeCloseTo(1.0, 5);

    // Fair must be < implied (juice removed)
    result.forEach((r) => {
      expect(r.fairProbability).toBeLessThan(r.impliedProbability);
    });
  });

  it('preserves labels', () => {
    const result = calculateFairProbabilities([
      { label: 'Yes', odds: 1.80 },
      { label: 'No', odds: 2.10 },
    ]);
    expect(result[0].label).toBe('Yes');
    expect(result[1].label).toBe('No');
  });

  it('throws on empty array', () => {
    expect(() => calculateFairProbabilities([])).toThrow();
  });
});
