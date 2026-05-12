import { NormalizedOdds } from '@/lib/contracts/odds';
import { OddsMarket, OddsSelection } from '@/lib/contracts/odds';
import { MarketType, EXPECTED_SELECTIONS } from '@/lib/contracts/pick';
import { Competition } from '@/lib/contracts/pick';
import { THE_ODDS_API_KEYS } from '@/lib/constants/competitions';
import { calculateFairProbabilities } from '@/lib/probabilities/fair';
import { calculateOverround } from '@/lib/probabilities/overround';
import { oddsFetch } from './client';
import { ApiOddsEvent, ApiBookmaker, ApiMarket, ApiOutcome } from './types';

// Market key mapping: The Odds API → internal MarketType
const MARKET_KEY_MAP: Record<string, MarketType> = {
  h2h: 'MATCH_WINNER',
  btts: 'BTTS',
  totals: 'OVER_UNDER_25',
};

// Only process Over/Under at 2.5 from totals market
function isOver25(outcome: ApiOutcome): boolean {
  return outcome.point === 2.5;
}

function buildSelections(
  market: ApiMarket,
  marketType: MarketType
): OddsSelection[] | null {
  let outcomes = market.outcomes;

  if (marketType === 'OVER_UNDER_25') {
    outcomes = outcomes.filter(isOver25);
    if (outcomes.length < 2) return null;
  }

  if (outcomes.length < EXPECTED_SELECTIONS[marketType]) return null;

  const raw = outcomes.map((o) => ({
    label: o.name as OddsSelection['label'],
    odds: o.price,
  }));

  const withFair = calculateFairProbabilities(raw);
  const overround = calculateOverround(raw.map((r) => r.odds));

  return withFair.map((s) => ({
    label: s.label as OddsSelection['label'],
    odds: s.odds,
    impliedProbability: s.impliedProbability,
    fairProbability: s.fairProbability,
  }));
}

function bestBookmaker(bookmakers: ApiBookmaker[], marketKey: string): ApiMarket | null {
  // Prefer consensus: use the first bookmaker that has this market
  // Phase 2: average across bookmakers for more robust odds
  for (const bm of bookmakers) {
    const market = bm.markets.find((m) => m.key === marketKey);
    if (market) return market;
  }
  return null;
}

export async function fetchOdds(
  fixtureId: string,
  competition: Competition,
  apiKey: string
): Promise<NormalizedOdds> {
  const sportKey = THE_ODDS_API_KEYS[competition];
  const unavailable: NormalizedOdds = {
    fixtureId,
    provider: 'the-odds-api',
    retrievedAt: new Date(),
    bookmakers: [],
    markets: {},
    availability: 'NOT_AVAILABLE',
  };

  let events: ApiOddsEvent[];
  try {
    events = await oddsFetch<ApiOddsEvent[]>(
      `/sports/${sportKey}/odds`,
      { regions: 'us,eu', markets: 'h2h,totals,btts', oddsFormat: 'decimal' },
      apiKey
    );
  } catch {
    return unavailable;
  }

  // The Odds API doesn't filter by fixture ID — match by team names is unreliable.
  // We store the fixtureId for correlation but fetch the full event list.
  // Services layer is responsible for matching event to fixture.
  // Here we return the raw event list wrapped in a NormalizedOdds per event.
  // For now, return NOT_AVAILABLE so the service can match by event ID later.
  // TODO Phase 2: implement event-to-fixture ID mapping
  if (!events.length) return unavailable;

  // Return the first matching event for MVP (service will filter by fixture)
  const event = events[0];
  const bookmakerNames = event.bookmakers.map((b) => b.title);

  const markets: NormalizedOdds['markets'] = {};
  let hasAny = false;

  for (const [apiKey2, marketType] of Object.entries(MARKET_KEY_MAP) as [string, MarketType][]) {
    const raw = bestBookmaker(event.bookmakers, apiKey2);
    if (!raw) continue;

    const selections = buildSelections(raw, marketType);
    if (!selections) continue;

    const overround = calculateOverround(selections.map((s) => s.odds));
    const market: OddsMarket = { type: marketType, selections, overround };

    if (marketType === 'MATCH_WINNER') markets.matchWinner = market;
    else if (marketType === 'BTTS') markets.bothTeamsScore = market;
    else if (marketType === 'OVER_UNDER_25') markets.overUnder25 = market;

    hasAny = true;
  }

  const marketCount = Object.keys(markets).length;
  const availability =
    marketCount === 0
      ? 'NOT_AVAILABLE'
      : marketCount < 3
      ? 'PARTIALLY_AVAILABLE'
      : 'AVAILABLE';

  return {
    fixtureId,
    provider: 'the-odds-api',
    retrievedAt: new Date(),
    bookmakers: bookmakerNames,
    markets,
    availability,
  };
}
