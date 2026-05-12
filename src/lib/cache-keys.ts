import { Competition } from '@/lib/contracts/pick';

const V = 'v2'; // bump to bust Vercel Data Cache

export const CACHE_KEYS = {
  fixtures: (competition: Competition): string[] => [V, 'fixtures', competition],
  odds: (fixtureId: string): string[] => [V, 'odds', fixtureId],
  stats: (teamId: string, season: number): string[] => [V, 'stats', teamId, String(season)],
};

export const CACHE_TTL = {
  fixtures: 3600,   // 1 hour
  odds: 1800,       // 30 min — odds move
  stats: 3600,      // 1 hour
} as const;
