import { unstable_cache } from 'next/cache';
import { NormalizedOdds } from '@/lib/contracts/odds';
import { Competition } from '@/lib/contracts/pick';
import { CACHE_KEYS, CACHE_TTL } from '@/lib/cache-keys';
import { fetchOdds as fetchOddsFromTheOddsApi } from '@/providers/the-odds-api/odds';

function getOddsApiKey(): string | null {
  return process.env.THE_ODDS_API_KEY ?? null;
}

async function _getOdds(fixtureId: string, competition: Competition): Promise<NormalizedOdds> {
  const oddsApiKey = getOddsApiKey();

  // Primary: The Odds API
  if (oddsApiKey) {
    try {
      const result = await fetchOddsFromTheOddsApi(fixtureId, competition, oddsApiKey);
      if (result.availability !== 'NOT_AVAILABLE') return result;
    } catch (err) {
      console.error('[services/odds] The Odds API failed:', err);
    }
  }

  // All sources exhausted
  return {
    fixtureId,
    provider: 'the-odds-api',
    retrievedAt: new Date(),
    bookmakers: [],
    markets: {},
    availability: 'NOT_AVAILABLE',
  };
}

export async function getOdds(
  fixtureId: string,
  competition: Competition
): Promise<NormalizedOdds> {
  const cached = unstable_cache(
    () => _getOdds(fixtureId, competition),
    CACHE_KEYS.odds(fixtureId),
    { revalidate: CACHE_TTL.odds }
  );
  return cached();
}
