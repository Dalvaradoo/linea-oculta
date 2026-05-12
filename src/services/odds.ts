import { unstable_cache } from 'next/cache';
import { NormalizedOdds } from '@/lib/contracts/odds';
import { Competition } from '@/lib/contracts/pick';
import { CACHE_KEYS, CACHE_TTL } from '@/lib/cache-keys';
import { fetchOdds as fetchOddsFromTheOddsApi } from '@/providers/the-odds-api/odds';
import { NormalizedFixture } from '@/lib/contracts/fixture';

function getOddsApiKey(): string | null {
  return process.env.THE_ODDS_API_KEY ?? null;
}

async function _getOdds(fixture: NormalizedFixture): Promise<NormalizedOdds> {
  const oddsApiKey = getOddsApiKey();

  if (oddsApiKey) {
    try {
      const result = await fetchOddsFromTheOddsApi(
        fixture.id,
        fixture.competition,
        oddsApiKey,
        fixture.homeTeam.name,
        fixture.awayTeam.name,
        fixture.kickoff
      );
      if (result.availability !== 'NOT_AVAILABLE') return result;
    } catch (err) {
      console.error('[services/odds] The Odds API failed:', err);
    }
  }

  return {
    fixtureId: fixture.id,
    provider: 'the-odds-api',
    retrievedAt: new Date(),
    bookmakers: [],
    markets: {},
    availability: 'NOT_AVAILABLE',
  };
}

export async function getOdds(fixture: NormalizedFixture): Promise<NormalizedOdds> {
  const cached = unstable_cache(
    () => _getOdds(fixture),
    CACHE_KEYS.odds(fixture.id),
    { revalidate: CACHE_TTL.odds }
  );
  return cached();
}
