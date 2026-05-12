import { unstable_cache } from 'next/cache';
import { NormalizedFixture } from '@/lib/contracts/fixture';
import { Competition } from '@/lib/contracts/pick';
import { CACHE_KEYS, CACHE_TTL } from '@/lib/cache-keys';
import { fetchFixtures } from '@/providers/apifootball/fixtures';

function getApiKey(): string {
  const key = process.env.APIFOOTBALL_KEY;
  if (!key) throw new Error('APIFOOTBALL_KEY is not set');
  return key;
}

async function _getFixtures(competition: Competition): Promise<NormalizedFixture[]> {
  try {
    return await fetchFixtures(competition, getApiKey());
  } catch (err) {
    console.error('[services/fixtures] fetch failed:', err);
    return [];
  }
}

export async function getFixtures(competition: Competition): Promise<NormalizedFixture[]> {
  const cached = unstable_cache(
    () => _getFixtures(competition),
    CACHE_KEYS.fixtures(competition),
    { revalidate: CACHE_TTL.fixtures }
  );
  return cached();
}

export async function getFixturesForAllCompetitions(): Promise<NormalizedFixture[]> {
  const [ligaMx, wc] = await Promise.all([
    getFixtures('LIGA_MX'),
    getFixtures('WC_2026'),
  ]);
  return [...ligaMx, ...wc].sort(
    (a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()
  );
}
