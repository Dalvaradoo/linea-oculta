import { AnalysisResult, PickAnalysis, MarketAnalysis, CalculationTrace } from '@/lib/contracts/analysis';
import { NormalizedFixture } from '@/lib/contracts/fixture';
import { NormalizedOdds, OddsMarket } from '@/lib/contracts/odds';
import { NormalizedTeamStats } from '@/lib/contracts/team-stats';
import { MarketType } from '@/lib/contracts/pick';
import { calculateFairProbabilities } from '@/lib/probabilities/fair';
import { formatAmerican } from '@/lib/probabilities/american-odds';
import { calculateOverround } from '@/lib/probabilities/overround';
import { runModel } from '@/lib/model/index';
import { calculateEdge } from '@/lib/evaluation/edge';
import { checkGuardrails, anyGuardrailActive } from '@/lib/evaluation/guardrails';
import { assignLabel } from '@/lib/evaluation/labels';
import { assessConfidence } from '@/lib/evaluation/confidence';
import { buildReasonCodes } from '@/lib/evaluation/reason-codes';

const MODEL_VERSION = 'poisson-v1';

function analyzePick(
  selection: string,
  odds: number,
  modelProbability: number,
  market: OddsMarket,
  homeStats: NormalizedTeamStats,
  awayStats: NormalizedTeamStats,
  trace: CalculationTrace
): PickAnalysis {
  const selectionData = market.selections.find((s) => s.label === selection);
  if (!selectionData) throw new Error(`Selection ${selection} not found in market`);

  const { edge, edgePct } = calculateEdge(modelProbability, selectionData.fairProbability);

  const flags = checkGuardrails({
    oddsAvailable: true,
    homeGamesPlayed: homeStats.gamesPlayed.home,
    awayGamesPlayed: awayStats.gamesPlayed.away,
    edgePct,
    modelProbability,
    fairProbability: selectionData.fairProbability,
    market,
    statsRetrievedAt: homeStats.retrievedAt,
    competition: homeStats.primaryCompetition,
    gamesUsed: homeStats.gamesPlayed.total + awayStats.gamesPlayed.total,
  });

  const label = assignLabel(edgePct, flags);
  const confidence = assessConfidence(
    homeStats.gamesPlayed.home,
    awayStats.gamesPlayed.away,
    homeStats.primaryCompetition,
    homeStats.gamesPlayed.total + awayStats.gamesPlayed.total,
    { highRiskEdge: flags.highRiskEdge, marketModelDivergence: flags.marketModelDivergence }
  );
  const reasonCodes = buildReasonCodes(edgePct, label, flags);

  return {
    selection,
    odds,
    oddsAmerican: formatAmerican(odds),
    impliedProbability: selectionData.impliedProbability,
    overround: market.overround,
    fairProbability: selectionData.fairProbability,
    modelProbability,
    edge,
    edgePct,
    label,
    confidence,
    reasonCodes,
    flags,
    trace,
    explanation: null,
  };
}

function buildTrace(
  homeStats: NormalizedTeamStats,
  awayStats: NormalizedTeamStats,
  modelOutput: ReturnType<typeof runModel>
): CalculationTrace {
  return {
    homeAttackStrength: modelOutput.strengths.attackHome,
    homeDefenseStrength: modelOutput.strengths.defenseHome,
    awayAttackStrength: modelOutput.strengths.attackAway,
    awayDefenseStrength: modelOutput.strengths.defenseAway,
    lambdaHome: modelOutput.expectedGoals.lambdaHome,
    lambdaAway: modelOutput.expectedGoals.lambdaAway,
    scoreMatrix: modelOutput.scoreMatrix.matrix,
    derivedProbabilities: modelOutput.probabilities,
    oddsSource: 'the-odds-api',
    statsSource: 'api-football',
    gamesUsed: {
      home: homeStats.gamesPlayed.home,
      away: awayStats.gamesPlayed.away,
    },
  };
}

function analyzeMarket(
  market: OddsMarket,
  marketType: MarketType,
  homeStats: NormalizedTeamStats,
  awayStats: NormalizedTeamStats,
  modelOutput: ReturnType<typeof runModel>
): MarketAnalysis | null {
  const trace = buildTrace(homeStats, awayStats, modelOutput);
  const probs = modelOutput.probabilities;

  const selectionProbMap: Record<string, number> = {
    Home: probs.home,
    Draw: probs.draw,
    Away: probs.away,
    Yes: probs.bttsYes,
    No: probs.bttsNo,
    'Over 2.5': probs.over25,
    'Under 2.5': probs.under25,
  };

  const picks: PickAnalysis[] = market.selections
    .map((s) => {
      const modelProb = selectionProbMap[s.label];
      if (modelProb === undefined) return null;
      return analyzePick(s.label, s.odds, modelProb, market, homeStats, awayStats, trace);
    })
    .filter((p): p is PickAnalysis => p !== null);

  if (!picks.length) return null;
  return { market: marketType, picks };
}

export function runAnalysis(
  fixture: NormalizedFixture,
  odds: NormalizedOdds,
  homeStats: NormalizedTeamStats,
  awayStats: NormalizedTeamStats
): AnalysisResult {
  const oddsAvail: AnalysisResult['dataAvailability']['odds'] =
    odds.availability === 'NOT_AVAILABLE' ? 'NOT_AVAILABLE' : 'AVAILABLE';

  const homeAvail = homeStats.dataQuality;
  const awayAvail = awayStats.dataQuality;

  // Can't run model without stats or odds
  if (
    odds.availability === 'NOT_AVAILABLE' ||
    homeStats.dataQuality === 'NOT_AVAILABLE' ||
    awayStats.dataQuality === 'NOT_AVAILABLE'
  ) {
    return {
      fixtureId: fixture.id,
      generatedAt: new Date(),
      competition: fixture.competition,
      markets: [],
      modelVersion: MODEL_VERSION,
      dataAvailability: { odds: oddsAvail, homeStats: homeAvail, awayStats: awayAvail },
    };
  }

  const modelOutput = runModel(homeStats, awayStats);

  const markets: MarketAnalysis[] = [];

  if (odds.markets.matchWinner) {
    const m = analyzeMarket(odds.markets.matchWinner, 'MATCH_WINNER', homeStats, awayStats, modelOutput);
    if (m) {
      // Replace generic Home/Away labels with actual team names
      const named: MarketAnalysis = {
        ...m,
        picks: m.picks.map((p) => ({
          ...p,
          selection:
            p.selection === 'Home' ? fixture.homeTeam.name
            : p.selection === 'Away' ? fixture.awayTeam.name
            : p.selection,
        })),
      };
      markets.push(named);
    }
  }
  if (odds.markets.bothTeamsScore) {
    const m = analyzeMarket(odds.markets.bothTeamsScore, 'BTTS', homeStats, awayStats, modelOutput);
    if (m) markets.push(m);
  }
  if (odds.markets.overUnder25) {
    const m = analyzeMarket(odds.markets.overUnder25, 'OVER_UNDER_25', homeStats, awayStats, modelOutput);
    if (m) markets.push(m);
  }

  return {
    fixtureId: fixture.id,
    generatedAt: new Date(),
    competition: fixture.competition,
    markets,
    modelVersion: MODEL_VERSION,
    dataAvailability: { odds: oddsAvail, homeStats: homeAvail, awayStats: awayAvail },
  };
}
