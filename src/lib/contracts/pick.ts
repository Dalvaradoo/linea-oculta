export type Competition = 'LIGA_MX' | 'WC_2026';

export type DataAvailability =
  | 'AVAILABLE'
  | 'SUFFICIENT'
  | 'INSUFFICIENT'
  | 'NOT_AVAILABLE';

export type MarketType = 'MATCH_WINNER' | 'BTTS' | 'OVER_UNDER_25';

export const EXPECTED_SELECTIONS: Record<MarketType, number> = {
  MATCH_WINNER: 3,
  BTTS: 2,
  OVER_UNDER_25: 2,
};

export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export type Label = 'VALUE' | 'LEAN' | 'FAIR' | 'AVOID';

export type ReasonCode =
  | 'POSITIVE_EDGE'
  | 'LOW_EDGE'
  | 'MARKET_MODEL_DIVERGENCE'
  | 'INSUFFICIENT_DATA'
  | 'STATS_NOT_AVAILABLE'
  | 'ODDS_NOT_AVAILABLE'
  | 'HIGH_RISK_EDGE'
  | 'MODEL_UNCERTAINTY'
  | 'WC_LIMITED_DATA'
  | 'GUARDRAIL_TRIGGERED';

export interface GuardrailFlags {
  insufficientData: boolean;
  highRiskEdge: boolean;
  marketModelDivergence: boolean;
  oddsNotAvailable: boolean;
  incompleteMarket: boolean;
  staleData: boolean;
  wcLimitedData: boolean;
}

export interface ApiResponse<T> {
  data: T | null;
  status: string;
  message?: string;
}
