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

function mapH2HLabel(
  name: string,
  homeTeam: string,
  awayTeam: string
): OddsSelection['label'] {
  if (name === 'Draw') return 'Draw';
  if (name === homeTeam) return 'Home';
  if (name === awayTeam) return 'Away';
  // fuzzy fallback
  const n = name.toLowerCase();
  if (homeTeam.toLowerCase().includes(n) || n.includes(homeTeam.toLowerCase())) return 'Home';
  return 'Away';
}

function buildSelections(
  market: ApiMarket,
  marketType: MarketType,
  homeTeam = '',
  awayTeam = ''
): OddsSelection[] | null {
  let outcomes = market.outcomes;

  if (marketType === 'OVER_UNDER_25') {
    outcomes = outcomes.filter(isOver25);
    if (outcomes.length < 2) return null;
  }

  if (outcomes.length < EXPECTED_SELECTIONS[marketType]) return null;

  const raw = outcomes.map((o) => {
    let label: OddsSelection['label'];
    if (marketType === 'MATCH_WINNER') {
      label = mapH2HLabel(o.name, homeTeam, awayTeam);
    } else if (marketType === 'OVER_UNDER_25') {
      label = o.name.toLowerCase().startsWith('over') ? 'Over 2.5' : 'Under 2.5';
    } else {
      label = o.name as OddsSelection['label'];
    }
    return { label, odds: o.price };
  });

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

// Normalize team name for fuzzy matching: lowercase, strip accents, remove common suffixes
function normalizeTeamName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\b(fc|cf|sc|ac|cd|ud|club|atletico|deportivo|chivas|pumas|tigres|unam|uanl)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function teamNamesMatch(a: string, b: string): boolean {
  const na = normalizeTeamName(a);
  const nb = normalizeTeamName(b);
  return na.includes(nb) || nb.includes(na) || na === nb;
}

function findMatchingEvent(
  events: ApiOddsEvent[],
  homeTeamName: string,
  awayTeamName: string,
  kickoff: Date | string
): ApiOddsEvent | null {
  const kickoffMs = new Date(kickoff).getTime();
  const ONE_DAY = 24 * 60 * 60 * 1000;

  return events.find((e) => {
    const eventMs = new Date(e.commence_time).getTime();
    const withinDay = Math.abs(eventMs - kickoffMs) <= ONE_DAY;
    return (
      withinDay &&
      teamNamesMatch(e.home_team, homeTeamName) &&
      teamNamesMatch(e.away_team, awayTeamName)
    );
  }) ?? null;
}

export async function fetchOdds(
  fixtureId: string,
  competition: Competition,
  apiKey: string,
  homeTeamName?: string,
  awayTeamName?: string,
  kickoff?: Date | string
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
    // btts is not universally supported — query h2h+totals first, btts separately
    events = await oddsFetch<ApiOddsEvent[]>(
      `/sports/${sportKey}/odds`,
      { regions: 'us,eu', markets: 'h2h,totals', oddsFormat: 'decimal' },
      apiKey
    );
  } catch (err) {
    console.error('[the-odds-api] oddsFetch failed:', err);
    return unavailable;
  }

  if (!events.length) return unavailable;

  // Match by team names + date when fixture context is available
  let event: ApiOddsEvent;
  if (homeTeamName && awayTeamName && kickoff) {
    const matched = findMatchingEvent(events, homeTeamName, awayTeamName, kickoff);
    if (!matched) return unavailable;
    event = matched;
  } else {
    event = events[0];
  }
  const bookmakerNames = event.bookmakers.map((b) => b.title);

  const markets: NormalizedOdds['markets'] = {};
  let hasAny = false;

  for (const [apiKey2, marketType] of Object.entries(MARKET_KEY_MAP) as [string, MarketType][]) {
    const raw = bestBookmaker(event.bookmakers, apiKey2);
    if (!raw) continue;

    const selections = buildSelections(raw, marketType, event.home_team, event.away_team);
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
