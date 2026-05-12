import { NormalizedTeamStats } from '@/lib/contracts/team-stats';
import { WC_BASELINE_LEAGUE_AVERAGES } from '@/lib/constants/competitions';
import { apifbFetch } from './client';
import { ApifbEvent } from './types';

// Pull results from the past 2.5 years for a meaningful sample
const FROM_DATE = '2023-01-01';

function toInt(s: string): number {
  const n = parseInt(s, 10);
  return isNaN(n) ? 0 : n;
}

function isCompleted(e: ApifbEvent): boolean {
  const score = e.match_hometeam_score;
  return score !== '' && score !== '?' && score !== '-';
}

export async function fetchWCTeamStats(
  teamId: string,
  apiKey: string
): Promise<NormalizedTeamStats> {
  const toDate = new Date().toISOString().split('T')[0];

  let events: ApifbEvent[];
  try {
    events = await apifbFetch<ApifbEvent[]>(
      { action: 'get_events', team_id: teamId, from: FROM_DATE, to: toDate },
      apiKey
    );
  } catch {
    return makeStub(teamId);
  }

  const completed = events.filter(isCompleted);
  if (!completed.length) return makeStub(teamId);

  const homeGames = completed.filter((e) => e.match_hometeam_id === teamId);
  const awayGames = completed.filter((e) => e.match_awayteam_id === teamId);

  const homeGF = homeGames.reduce((a, e) => a + toInt(e.match_hometeam_score), 0);
  const homeGA = homeGames.reduce((a, e) => a + toInt(e.match_awayteam_score), 0);
  const awayGF = awayGames.reduce((a, e) => a + toInt(e.match_awayteam_score), 0);
  const awayGA = awayGames.reduce((a, e) => a + toInt(e.match_hometeam_score), 0);

  const homePlayed = homeGames.length;
  const awayPlayed = awayGames.length;
  const total      = homePlayed + awayPlayed;

  const goalsPerGame = {
    home:  homePlayed > 0 ? homeGF / homePlayed : 0,
    away:  awayPlayed > 0 ? awayGF / awayPlayed : 0,
    total: total > 0 ? (homeGF + awayGF) / total : 0,
  };

  const concededPerGame = {
    home:  homePlayed > 0 ? homeGA / homePlayed : 0,
    away:  awayPlayed > 0 ? awayGA / awayPlayed : 0,
    total: total > 0 ? (homeGA + awayGA) / total : 0,
  };

  const dataQuality = total < 4 ? 'INSUFFICIENT' : 'SUFFICIENT';

  return {
    teamId,
    season: 2026,
    competitionsIncluded: ['international-2023-2026'],
    primaryCompetition: 'WC_2026',
    gamesPlayed:   { home: homePlayed, away: awayPlayed, total },
    goalsScored:   { home: homeGF,     away: awayGF,     total: homeGF + awayGF },
    goalsConceded: { home: homeGA,     away: awayGA,     total: homeGA + awayGA },
    goalsPerGame,
    concededPerGame,
    leagueAverages: WC_BASELINE_LEAGUE_AVERAGES,
    dataQuality,
    retrievedAt: new Date(),
  };
}

function makeStub(teamId: string): NormalizedTeamStats {
  const zero = { home: 0, away: 0, total: 0 };
  return {
    teamId,
    season: 2026,
    competitionsIncluded: [],
    primaryCompetition: 'WC_2026',
    gamesPlayed:   zero,
    goalsScored:   zero,
    goalsConceded: zero,
    goalsPerGame:  zero,
    concededPerGame: zero,
    leagueAverages: WC_BASELINE_LEAGUE_AVERAGES,
    dataQuality: 'NOT_AVAILABLE',
    retrievedAt: new Date(),
  };
}
