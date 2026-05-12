import { unstable_cache } from 'next/cache';
import { NormalizedTeamStats } from '@/lib/contracts/team-stats';
import { Competition } from '@/lib/contracts/pick';
import { CACHE_KEYS, CACHE_TTL } from '@/lib/cache-keys';
import { LIGA_MX_SEASON } from '@/lib/constants/competitions';
import { fetchTeamStats } from '@/providers/apifootball/stats';

function getApiKey(): string {
  const key = process.env.APIFOOTBALL_KEY;
  if (!key) throw new Error('APIFOOTBALL_KEY is not set');
  return key;
}

async function _getTeamStats(
  teamId: string,
  competition: Competition
): Promise<NormalizedTeamStats> {
  try {
    return await fetchTeamStats(teamId, competition, getApiKey());
  } catch (err) {
    console.error('[services/team-stats] fetch failed:', err);
    // Return NOT_AVAILABLE stub
    const zero = { home: 0, away: 0, total: 0 };
    return {
      teamId,
      season: LIGA_MX_SEASON,
      competitionsIncluded: [],
      primaryCompetition: competition,
      gamesPlayed: zero,
      goalsScored: zero,
      goalsConceded: zero,
      goalsPerGame: zero,
      concededPerGame: zero,
      leagueAverages: { goalsPerHomeGame: 0, goalsPerAwayGame: 0 },
      dataQuality: 'NOT_AVAILABLE',
      retrievedAt: new Date(),
    };
  }
}

export async function getTeamStats(
  teamId: string,
  competition: Competition
): Promise<NormalizedTeamStats> {
  const cached = unstable_cache(
    () => _getTeamStats(teamId, competition),
    CACHE_KEYS.stats(teamId, LIGA_MX_SEASON),
    { revalidate: CACHE_TTL.stats }
  );
  return cached();
}
