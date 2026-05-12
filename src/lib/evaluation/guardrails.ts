import { GuardrailFlags, MarketType, EXPECTED_SELECTIONS } from '@/lib/contracts/pick';
import { OddsMarket } from '@/lib/contracts/odds';

export const MIN_GAMES_THRESHOLD = 4;
export const HIGH_RISK_EDGE_THRESHOLD = 25;
export const MARKET_DIVERGENCE_THRESHOLD = 0.40;
export const STALE_DATA_MS = 6 * 60 * 60 * 1000;
export const WC_LIMITED_DATA_THRESHOLD = 10;

export interface GuardrailInput {
  oddsAvailable: boolean;
  homeGamesPlayed: number;
  awayGamesPlayed: number;
  edgePct: number;
  modelProbability: number;
  fairProbability: number;
  market: OddsMarket;
  statsRetrievedAt: Date;
  competition: string;
  gamesUsed: number;
}

export function checkGuardrails(input: GuardrailInput): GuardrailFlags {
  const {
    oddsAvailable,
    homeGamesPlayed,
    awayGamesPlayed,
    edgePct,
    modelProbability,
    fairProbability,
    market,
    statsRetrievedAt,
    competition,
    gamesUsed,
  } = input;

  return {
    oddsNotAvailable: !oddsAvailable,
    insufficientData:
      homeGamesPlayed < MIN_GAMES_THRESHOLD ||
      awayGamesPlayed < MIN_GAMES_THRESHOLD,
    highRiskEdge: Math.abs(edgePct) > HIGH_RISK_EDGE_THRESHOLD,
    marketModelDivergence:
      Math.abs(modelProbability - fairProbability) > MARKET_DIVERGENCE_THRESHOLD,
    incompleteMarket:
      market.selections.length < EXPECTED_SELECTIONS[market.type],
    staleData: Date.now() - statsRetrievedAt.getTime() > STALE_DATA_MS,
    wcLimitedData: competition === 'WC_2026' && gamesUsed < WC_LIMITED_DATA_THRESHOLD,
  };
}

export function anyGuardrailActive(flags: GuardrailFlags): boolean {
  return Object.values(flags).some(Boolean);
}
