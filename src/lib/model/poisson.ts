const MAX_GOALS = 6;

// Dixon-Coles (1997) correlation parameter — corrects underestimation of
// low-scoring outcomes (0-0, 1-0, 0-1, 1-1). Estimated from literature: ~-0.13
export const DIXON_COLES_RHO = -0.13;

export function poissonPMF(k: number, lambda: number): number {
  if (lambda <= 0) throw new Error(`lambda must be > 0, got ${lambda}`);
  if (k < 0 || !Number.isInteger(k)) throw new Error(`k must be a non-negative integer, got ${k}`);
  // e^-λ * λ^k / k!  — computed in log space to avoid overflow
  let logFactorial = 0;
  for (let i = 2; i <= k; i++) logFactorial += Math.log(i);
  return Math.exp(-lambda + k * Math.log(lambda) - logFactorial);
}

// τ correction factor for low-scoring cells only
function tau(h: number, a: number, lH: number, lA: number, rho: number): number {
  if (h === 0 && a === 0) return 1 - lH * lA * rho;
  if (h === 1 && a === 0) return 1 + lA * rho;
  if (h === 0 && a === 1) return 1 + lH * rho;
  if (h === 1 && a === 1) return 1 - rho;
  return 1;
}

export interface ScoreMatrix {
  matrix: number[][];
  totalProbability: number;
}

export function buildScoreMatrix(lambdaHome: number, lambdaAway: number): ScoreMatrix {
  const matrix: number[][] = [];
  let total = 0;

  for (let h = 0; h <= MAX_GOALS; h++) {
    matrix[h] = [];
    for (let a = 0; a <= MAX_GOALS; a++) {
      const p = poissonPMF(h, lambdaHome) * poissonPMF(a, lambdaAway)
                * tau(h, a, lambdaHome, lambdaAway, DIXON_COLES_RHO);
      matrix[h][a] = p;
      total += p;
    }
  }

  // Normalize — matrix is truncated at MAX_GOALS so total < 1 for high λ
  for (let h = 0; h <= MAX_GOALS; h++) {
    for (let a = 0; a <= MAX_GOALS; a++) {
      matrix[h][a] /= total;
    }
  }

  return { matrix, totalProbability: total };
}
