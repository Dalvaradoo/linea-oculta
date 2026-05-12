import { NormalizedTeamStats } from '@/lib/contracts/team-stats';
import { Competition } from '@/lib/contracts/pick';
import {
  API_FOOTBALL_IDS,
  LIGA_MX_SEASON,
  WC_BASELINE_LEAGUE_AVERAGES,
} from '@/lib/constants/competitions';
import { apiFetch } from './client';
import { ApiFootballResponse, ApiTeamStatistics } from './types';

// Minimum games to compute league averages from actual data.
// Below this we fall back to baseline (WC) or season so far (Liga MX).
const MIN_LEAGUE_SAMPLE = 5;

function parseAvg(s: string): number {
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

export async function fetchTeamStats(
  teamId: string,
  competition: Competition,
  apiKey: string
): Promise<NormalizedTeamStats> {
  const leagueId = API_FOOTBALL_IDS[competition];
  const season = LIGA_MX_SEASON;

  const data = await apiFetch<ApiFootballResponse<ApiTeamStatistics>>(
    '/teams/statistics',
    { team: teamId, league: leagueId, season },
    apiKey
  );

  if (!data.response.length) {
    // Return a NOT_AVAILABLE stub — caller will handle this
    return makeUnavailableStub(teamId, competition, season);
  }

  const s = data.response[0];
  const played = s.fixtures.played;
  const scored = s.goals.for;
  const conceded = s.goals.against;

  const goalsPerGame = {
    home: parseAvg(scored.average.home),
    away: parseAvg(scored.average.away),
    total: parseAvg(scored.average.total),
  };

  const concededPerGame = {
    home: parseAvg(conceded.average.home),
    away: parseAvg(conceded.average.away),
    total: parseAvg(conceded.average.total),
  };

  // League averages: computed from all available team data is ideal,
  // but requires a separate aggregate call. For MVP, derive from the
  // team's own stats as an approximation, with WC baseline as fallback.
  const leagueAverages =
    competition === 'WC_2026' && played.total < MIN_LEAGUE_SAMPLE
      ? WC_BASELINE_LEAGUE_AVERAGES
      : { goalsPerHomeGame: goalsPerGame.home, goalsPerAwayGame: goalsPerGame.away };

  const totalGames = played.home + played.away;
  const dataQuality =
    totalGames === 0
      ? 'NOT_AVAILABLE'
      : totalGames < 4
      ? 'INSUFFICIENT'
      : 'SUFFICIENT';

  return {
    teamId,
    season,
    competitionsIncluded: [String(leagueId)],
    primaryCompetition: competition,
    gamesPlayed: played,
    goalsScored: scored.total,
    goalsConceded: conceded.total,
    goalsPerGame,
    concededPerGame,
    leagueAverages,
    dataQuality,
    retrievedAt: new Date(),
  };
}

function makeUnavailableStub(
  teamId: string,
  competition: Competition,
  season: number
): NormalizedTeamStats {
  const zero = { home: 0, away: 0, total: 0 };
  return {
    teamId,
    season,
    competitionsIncluded: [],
    primaryCompetition: competition,
    gamesPlayed: zero,
    goalsScored: zero,
    goalsConceded: zero,
    goalsPerGame: zero,
    concededPerGame: zero,
    leagueAverages: WC_BASELINE_LEAGUE_AVERAGES,
    dataQuality: 'NOT_AVAILABLE',
    retrievedAt: new Date(),
  };
}
