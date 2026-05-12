import { NormalizedTeamStats } from '@/lib/contracts/team-stats';
import { Competition } from '@/lib/contracts/pick';
import { WC_BASELINE_LEAGUE_AVERAGES } from '@/lib/constants/competitions';
import { apifbFetch } from './client';
import { ApifbStanding } from './types';

const LEAGUE_IDS: Record<Competition, string> = {
  LIGA_MX: '235',
  WC_2026: '1180',
};

function safe(s: string): number {
  const n = parseInt(s, 10);
  return isNaN(n) ? 0 : n;
}

export async function fetchTeamStats(
  teamId: string,
  competition: Competition,
  apiKey: string
): Promise<NormalizedTeamStats> {
  const leagueId = LEAGUE_IDS[competition];

  const data = await apifbFetch<ApifbStanding[]>(
    { action: 'get_standings', league_id: leagueId },
    apiKey
  );

  const standing = data.find((s) => s.team_id === teamId);

  if (!standing) {
    return makeUnavailableStub(teamId, competition);
  }

  const homePlayed = safe(standing.home_league_payed);
  const awayPlayed = safe(standing.away_league_payed);
  const homeGF = safe(standing.home_league_GF);
  const homeGA = safe(standing.home_league_GA);
  const awayGF = safe(standing.away_league_GF);
  const awayGA = safe(standing.away_league_GA);

  const goalsPerGame = {
    home: homePlayed > 0 ? homeGF / homePlayed : 0,
    away: awayPlayed > 0 ? awayGF / awayPlayed : 0,
    total: (homePlayed + awayPlayed) > 0 ? (homeGF + awayGF) / (homePlayed + awayPlayed) : 0,
  };

  const concededPerGame = {
    home: homePlayed > 0 ? homeGA / homePlayed : 0,
    away: awayPlayed > 0 ? awayGA / awayPlayed : 0,
    total: (homePlayed + awayPlayed) > 0 ? (homeGA + awayGA) / (homePlayed + awayPlayed) : 0,
  };

  // League averages: compute from all standings in this call
  // (called once per service request, so no extra API quota cost)
  const leagueAverages = computeLeagueAverages(data);

  const total = homePlayed + awayPlayed;
  const dataQuality = total === 0 ? 'NOT_AVAILABLE' : total < 4 ? 'INSUFFICIENT' : 'SUFFICIENT';

  return {
    teamId,
    season: new Date().getFullYear(),
    competitionsIncluded: [leagueId],
    primaryCompetition: competition,
    gamesPlayed: { home: homePlayed, away: awayPlayed, total },
    goalsScored: { home: homeGF, away: awayGF, total: homeGF + awayGF },
    goalsConceded: { home: homeGA, away: awayGA, total: homeGA + awayGA },
    goalsPerGame,
    concededPerGame,
    leagueAverages,
    dataQuality,
    retrievedAt: new Date(),
  };
}

function computeLeagueAverages(standings: ApifbStanding[]) {
  const teams = standings.filter((s) => safe(s.home_league_payed) > 0);
  if (!teams.length) return WC_BASELINE_LEAGUE_AVERAGES;

  const totalHomePlayed = teams.reduce((a, s) => a + safe(s.home_league_payed), 0);
  const totalHomeGF = teams.reduce((a, s) => a + safe(s.home_league_GF), 0);
  const totalAwayPlayed = teams.reduce((a, s) => a + safe(s.away_league_payed), 0);
  const totalAwayGF = teams.reduce((a, s) => a + safe(s.away_league_GF), 0);

  return {
    goalsPerHomeGame: totalHomePlayed > 0 ? totalHomeGF / totalHomePlayed : 1.3,
    goalsPerAwayGame: totalAwayPlayed > 0 ? totalAwayGF / totalAwayPlayed : 1.1,
  };
}

function makeUnavailableStub(teamId: string, competition: Competition): NormalizedTeamStats {
  const zero = { home: 0, away: 0, total: 0 };
  return {
    teamId,
    season: new Date().getFullYear(),
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
