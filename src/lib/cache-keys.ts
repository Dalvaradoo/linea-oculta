import { Competition } from '@/lib/contracts/pick';

export const CACHE_KEYS = {
  fixtures: (competition: Competition): string[] => ['fixtures', competition],
  odds: (fixtureId: string): string[] => ['odds', fixtureId],
  stats: (teamId: string, season: number): string[] => ['stats', teamId, String(season)],
};

export const CACHE_TTL = {
  fixtures: 3600,   // 1 hour
  odds: 1800,       // 30 min — odds move
  stats: 3600,      // 1 hour
} as const;
