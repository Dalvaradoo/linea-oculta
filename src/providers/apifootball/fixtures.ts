import { NormalizedFixture } from '@/lib/contracts/fixture';
import { Competition } from '@/lib/contracts/pick';
import { apifbFetch } from './client';
import { ApifbEvent } from './types';

// apifootball.com league IDs
const LEAGUE_IDS: Record<Competition, string> = {
  LIGA_MX: '235',
  WC_2026: '1180', // FIFA World Cup 2026 — verify when tournament opens
};

function mapStatus(status: string): NormalizedFixture['status'] {
  const s = status.toLowerCase();
  if (s === 'not started' || s === '') return 'SCHEDULED';
  if (s === 'finished' || s === 'after extra time' || s === 'after penalties') return 'FINISHED';
  if (s === 'postponed' || s === 'suspended') return 'POSTPONED';
  if (s === 'cancelled') return 'CANCELLED';
  return 'LIVE';
}

export async function fetchFixtures(
  competition: Competition,
  apiKey: string,
  daysAhead = 7
): Promise<NormalizedFixture[]> {
  const leagueId = LEAGUE_IDS[competition];
  const from = new Date();
  const to = new Date(from);
  to.setDate(to.getDate() + daysAhead);

  const fmt = (d: Date) => d.toISOString().split('T')[0];

  const data = await apifbFetch<ApifbEvent[]>(
    { action: 'get_events', from: fmt(from), to: fmt(to), league_id: leagueId },
    apiKey
  );

  return data.map((f): NormalizedFixture => ({
    id: f.match_id,
    externalId: f.match_id,
    provider: 'api-football' as const, // reuse existing provider type
    homeTeam: {
      id: f.match_hometeam_id,
      name: f.match_hometeam_name,
      logo: f.team_home_badge,
    },
    awayTeam: {
      id: f.match_awayteam_id,
      name: f.match_awayteam_name,
      logo: f.team_away_badge,
    },
    kickoff: new Date(`${f.match_date}T${f.match_time || '00:00'}:00`),
    competition,
    round: f.league_round,
    venue: f.match_stadium || undefined,
    status: mapStatus(f.match_status),
    dataQuality: 'AVAILABLE',
  }));
}
