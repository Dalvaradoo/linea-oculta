export function decimalToAmerican(decimal: number): number {
  if (decimal >= 2.0) {
    return Math.round((decimal - 1) * 100);
  }
  return Math.round(-100 / (decimal - 1));
}

export function formatAmerican(decimal: number): string {
  const american = decimalToAmerican(decimal);
  return american > 0 ? `+${american}` : String(american);
}
