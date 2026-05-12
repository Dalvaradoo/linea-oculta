export interface KellyResult {
  full: number;  // full Kelly fraction (0–0.25 capped)
  half: number;  // half Kelly — recommended for practical use
}

// f* = (p·b − q) / b  where b = decimal odds − 1
export function calculateKelly(
  modelProbability: number,
  decimalOdds: number
): KellyResult {
  const b = decimalOdds - 1;
  if (b <= 0) return { full: 0, half: 0 };
  const p = modelProbability;
  const q = 1 - p;
  const full = Math.max(0, Math.min((p * b - q) / b, 0.25));
  return { full, half: full / 2 };
}
