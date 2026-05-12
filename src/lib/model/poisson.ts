const MAX_GOALS = 6;

export function poissonPMF(k: number, lambda: number): number {
  if (lambda <= 0) throw new Error(`lambda must be > 0, got ${lambda}`);
  if (k < 0 || !Number.isInteger(k)) throw new Error(`k must be a non-negative integer, got ${k}`);
  // e^-λ * λ^k / k!  — computed in log space to avoid overflow
  let logFactorial = 0;
  for (let i = 2; i <= k; i++) logFactorial += Math.log(i);
  return Math.exp(-lambda + k * Math.log(lambda) - logFactorial);
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
      const p = poissonPMF(h, lambdaHome) * poissonPMF(a, lambdaAway);
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
