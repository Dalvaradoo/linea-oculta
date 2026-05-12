import { ConfidenceLevel, GuardrailFlags } from '@/lib/contracts/pick';
import { MIN_GAMES_THRESHOLD, WC_LIMITED_DATA_THRESHOLD } from './guardrails';

const HIGH_THRESHOLD = 8;

type DowngradeFlag = Pick<GuardrailFlags, 'highRiskEdge' | 'marketModelDivergence'>;

export function assessConfidence(
  homeGamesPlayed: number,
  awayGamesPlayed: number,
  competition: string,
  gamesUsed: number,
  flags: DowngradeFlag
): ConfidenceLevel {
  // INSUFFICIENT_DATA forces LOW directly — no downgrade steps
  if (
    homeGamesPlayed < MIN_GAMES_THRESHOLD ||
    awayGamesPlayed < MIN_GAMES_THRESHOLD
  ) {
    return 'LOW';
  }

  const base: ConfidenceLevel =
    homeGamesPlayed >= HIGH_THRESHOLD && awayGamesPlayed >= HIGH_THRESHOLD
      ? 'HIGH'
      : 'MEDIUM';

  // WC_LIMITED_DATA caps at MEDIUM
  const afterWc: ConfidenceLevel =
    competition === 'WC_2026' && gamesUsed < WC_LIMITED_DATA_THRESHOLD
      ? base === 'HIGH'
        ? 'MEDIUM'
        : base
      : base;

  // HIGH_RISK_EDGE or MARKET_MODEL_DIVERGENCE lower one level
  const downgrade = flags.highRiskEdge || flags.marketModelDivergence;
  if (!downgrade) return afterWc;

  if (afterWc === 'HIGH') return 'MEDIUM';
  if (afterWc === 'MEDIUM') return 'LOW';
  return 'LOW';
}
