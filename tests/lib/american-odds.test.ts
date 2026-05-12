import { describe, it, expect } from 'vitest';
import { decimalToAmerican, formatAmerican } from '@/lib/probabilities/american-odds';

describe('decimalToAmerican', () => {
  it('2.05 → +105', () => expect(decimalToAmerican(2.05)).toBe(105));
  it('3.10 → +210', () => expect(decimalToAmerican(3.10)).toBe(210));
  it('1.85 → -118', () => expect(decimalToAmerican(1.85)).toBe(-118));
  it('2.00 → +100', () => expect(decimalToAmerican(2.00)).toBe(100));
  it('1.50 → -200', () => expect(decimalToAmerican(1.50)).toBe(-200));
  it('1.25 → -400', () => expect(decimalToAmerican(1.25)).toBe(-400));
  it('4.00 → +300', () => expect(decimalToAmerican(4.00)).toBe(300));
});

describe('formatAmerican', () => {
  it('prefixes + on positives', () => expect(formatAmerican(2.05)).toBe('+105'));
  it('no prefix on negatives', () => expect(formatAmerican(1.85)).toBe('-118'));
  it('even money +100', () => expect(formatAmerican(2.00)).toBe('+100'));
});
