import { describe, it, expect } from 'vitest';
import { poissonPMF, buildScoreMatrix } from '@/lib/model/poisson';

describe('poissonPMF', () => {
  it('P(0; 1.5) ≈ 0.2231', () => {
    expect(poissonPMF(0, 1.5)).toBeCloseTo(0.2231, 3);
  });

  it('P(1; 1.5) ≈ 0.3347', () => {
    expect(poissonPMF(1, 1.5)).toBeCloseTo(0.3347, 3);
  });

  it('P(2; 1.5) ≈ 0.2510', () => {
    expect(poissonPMF(2, 1.5)).toBeCloseTo(0.2510, 3);
  });

  it('throws on non-integer k', () => {
    expect(() => poissonPMF(1.5, 1.0)).toThrow();
  });

  it('throws on negative lambda', () => {
    expect(() => poissonPMF(0, -1)).toThrow();
  });

  it('throws on zero lambda', () => {
    expect(() => poissonPMF(0, 0)).toThrow();
  });
});

describe('buildScoreMatrix', () => {
  it('produces a normalized matrix (sums to ~1)', () => {
    const { matrix } = buildScoreMatrix(1.5, 1.0);
    let total = 0;
    for (const row of matrix) {
      for (const p of row) total += p;
    }
    expect(total).toBeCloseTo(1.0, 5);
  });

  it('all cells are non-negative', () => {
    const { matrix } = buildScoreMatrix(2.0, 1.2);
    for (const row of matrix) {
      for (const p of row) expect(p).toBeGreaterThanOrEqual(0);
    }
  });

  it('is a 7x7 matrix', () => {
    const { matrix } = buildScoreMatrix(1.5, 1.0);
    expect(matrix).toHaveLength(7);
    for (const row of matrix) expect(row).toHaveLength(7);
  });

  it('home-favored λ produces P(Home) > P(Away)', () => {
    const { matrix } = buildScoreMatrix(2.0, 0.8);
    let home = 0, away = 0;
    for (let h = 0; h < matrix.length; h++) {
      for (let a = 0; a < matrix[h].length; a++) {
        if (h > a) home += matrix[h][a];
        if (a > h) away += matrix[h][a];
      }
    }
    expect(home).toBeGreaterThan(away);
  });

  it('returns totalProbability < 1 for high lambda (truncation)', () => {
    const { totalProbability } = buildScoreMatrix(4.0, 4.0);
    // Before normalization total would be < 1 — we store the raw total
    expect(totalProbability).toBeLessThan(1.0);
  });
});
