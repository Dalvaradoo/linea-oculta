import { NormalizedFixture } from '@/lib/contracts/fixture';
import { Competition } from '@/lib/contracts/pick';
import { API_FOOTBALL_IDS, LIGA_MX_SEASON } from '@/lib/constants/competitions';
import { apiFetch, ApiFootballError } from './client';
import { ApiFootballResponse, ApiFixture } from './types';

function mapStatus(short: string): NormalizedFixture['status'] {
  const map: Record<string, NormalizedFixture['status']> = {
    TBD: 'SCHEDULED', NS: 'SCHEDULED', '1H': 'LIVE', HT: 'LIVE',
    '2H': 'LIVE', ET: 'LIVE', BT: 'LIVE', P: 'LIVE',
    FT: 'FINISHED', AET: 'FINISHED', PEN: 'FINISHED',
    SUSP: 'POSTPONED', INT: 'POSTPONED', PST: 'POSTPONED',
    CANC: 'CANCELLED', ABD: 'CANCELLED', AWD: 'FINISHED', WO: 'FINISHED',
  };
  return map[short] ?? 'SCHEDULED';
}

function mapCompetition(leagueId: number): Competition | null {
  if (leagueId === API_FOOTBALL_IDS.LIGA_MX) return 'LIGA_MX';
  if (leagueId === API_FOOTBALL_IDS.WC_2026) return 'WC_2026';
  return null;
}

export async function fetchFixtures(
  competition: Competition,
  apiKey: string,
  daysAhead = 7
): Promise<NormalizedFixture[]> {
  const leagueId = API_FOOTBALL_IDS[competition];
  const season = LIGA_MX_SEASON;

  const from = new Date();
  const to = new Date(from);
  to.setDate(to.getDate() + daysAhead);

  const fmt = (d: Date) => d.toISOString().split('T')[0];

  const data = await apiFetch<ApiFootballResponse<ApiFixture>>(
    '/fixtures',
    { league: leagueId, season, from: fmt(from), to: fmt(to), status: 'NS' },
    apiKey
  );

  return data.response
    .map((f): NormalizedFixture | null => {
      const comp = mapCompetition(f.league.id);
      if (!comp) return null;
      return {
        id: String(f.fixture.id),
        externalId: String(f.fixture.id),
        provider: 'api-football',
        homeTeam: {
          id: String(f.teams.home.id),
          name: f.teams.home.name,
          logo: f.teams.home.logo,
        },
        awayTeam: {
          id: String(f.teams.away.id),
          name: f.teams.away.name,
          logo: f.teams.away.logo,
        },
        kickoff: new Date(f.fixture.date),
        competition: comp,
        round: f.league.round,
        venue: f.fixture.venue.name ?? undefined,
        status: mapStatus(f.fixture.status.short),
        dataQuality: 'AVAILABLE',
      };
    })
    .filter((f): f is NormalizedFixture => f !== null);
}
