import {
  Competition,
  DataAvailability,
  MarketType,
  Label,
  ConfidenceLevel,
  ReasonCode,
  GuardrailFlags,
} from './pick';

export interface CalculationTrace {
  homeAttackStrength: number;
  homeDefenseStrength: number;
  awayAttackStrength: number;
  awayDefenseStrength: number;
  lambdaHome: number;
  lambdaAway: number;
  scoreMatrix: number[][];
  derivedProbabilities: {
    home: number;
    draw: number;
    away: number;
    bttsYes: number;
    over25: number;
    under25: number;
  };
  dixonColesRho: number;
  oddsSource: string;
  statsSource: string;
  gamesUsed: { home: number; away: number };
}

export interface PickAnalysis {
  selection: string;
  odds: number;
  oddsAmerican: string;   // e.g. "+105", "-118"
  impliedProbability: number;
  overround: number;
  fairProbability: number;
  modelProbability: number;
  edge: number;
  edgePct: number;
  kellyFull: number;  // fraction of bankroll (0–0.25)
  kellyHalf: number;  // ½ Kelly — recommended size
  label: Label;
  confidence: ConfidenceLevel;
  reasonCodes: ReasonCode[];
  flags: GuardrailFlags;
  trace: CalculationTrace;
  explanation: string | null;
}

export interface MarketAnalysis {
  market: MarketType;
  picks: PickAnalysis[];
}

export interface AnalysisResult {
  fixtureId: string;
  generatedAt: Date;
  competition: Competition;
  markets: MarketAnalysis[];
  modelVersion: string;
  dataAvailability: {
    odds: DataAvailability;
    homeStats: DataAvailability;
    awayStats: DataAvailability;
  };
}
