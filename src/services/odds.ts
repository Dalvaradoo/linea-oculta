import { unstable_cache } from 'next/cache';
import { NormalizedOdds } from '@/lib/contracts/odds';
import { Competition } from '@/lib/contracts/pick';
import { CACHE_KEYS, CACHE_TTL } from '@/lib/cache-keys';
import { fetchAllOddsEvents, normalizeOddsForFixture } from '@/providers/the-odds-api/odds';
import { ApiOddsEvent } from '@/providers/the-odds-api/types';
import { NormalizedFixture } from '@/lib/contracts/fixture';

function getOddsApiKey(): string | null {
  return process.env.THE_ODDS_API_KEY ?? null;
}

// 1 API call per competition per TTL — shared across all fixtures in that competition
async function _getOddsEventsBatch(competition: Competition): Promise<ApiOddsEvent[]> {
  const apiKey = getOddsApiKey();
  if (!apiKey) return [];
  try {
    return await fetchAllOddsEvents(competition, apiKey);
  } catch (err) {
    console.error('[services/odds] batch fetch failed:', err);
    return [];
  }
}

function getOddsEventsBatch(competition: Competition): Promise<ApiOddsEvent[]> {
  return unstable_cache(
    () => _getOddsEventsBatch(competition),
    CACHE_KEYS.oddsBatch(competition),
    { revalidate: CACHE_TTL.odds }
  )();
}

export async function getOdds(fixture: NormalizedFixture): Promise<NormalizedOdds> {
  const unavailable: NormalizedOdds = {
    fixtureId: fixture.id,
    provider: 'the-odds-api',
    retrievedAt: new Date(),
    bookmakers: [],
    markets: {},
    availability: 'NOT_AVAILABLE',
  };

  const events = await getOddsEventsBatch(fixture.competition);
  if (!events.length) return unavailable;

  return normalizeOddsForFixture(
    fixture.id,
    events,
    fixture.homeTeam.name,
    fixture.awayTeam.name,
    fixture.kickoff
  );
}
