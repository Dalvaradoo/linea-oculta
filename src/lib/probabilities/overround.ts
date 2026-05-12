import { decimalToImplied } from './implied';

export function calculateOverround(oddsArray: number[]): number {
  if (oddsArray.length === 0) throw new Error('oddsArray cannot be empty');
  const sum = oddsArray.reduce((acc, o) => acc + decimalToImplied(o), 0);
  return sum - 1;
}

export function sumImplied(oddsArray: number[]): number {
  return oddsArray.reduce((acc, o) => acc + decimalToImplied(o), 0);
}
