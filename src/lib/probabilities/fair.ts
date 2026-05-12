import { decimalToImplied } from './implied';
import { sumImplied } from './overround';

export interface FairProbabilityInput {
  label: string;
  odds: number;
}

export interface FairProbabilityResult {
  label: string;
  odds: number;
  impliedProbability: number;
  fairProbability: number;
}

export function calculateFairProbabilities(
  selections: FairProbabilityInput[]
): FairProbabilityResult[] {
  if (selections.length === 0) throw new Error('selections cannot be empty');
  const odds = selections.map((s) => s.odds);
  const total = sumImplied(odds);
  if (total <= 0) throw new Error('Total implied probability must be > 0');

  return selections.map((s) => {
    const implied = decimalToImplied(s.odds);
    return {
      label: s.label,
      odds: s.odds,
      impliedProbability: implied,
      fairProbability: implied / total,
    };
  });
}
