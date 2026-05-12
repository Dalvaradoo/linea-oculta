import { Competition } from './pick';

export interface NormalizedFixture {
  id: string;
  externalId: string;
  provider: 'api-football';
  homeTeam: { id: string; name: string; logo?: string };
  awayTeam: { id: string; name: string; logo?: string };
  kickoff: Date;
  competition: Competition;
  round?: string;
  venue?: string;
  status: 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'POSTPONED' | 'CANCELLED';
  dataQuality: 'AVAILABLE' | 'NOT_AVAILABLE';
}
