import { Competition } from '@/lib/contracts/pick';

export const API_FOOTBALL_IDS: Record<Competition, number> = {
  LIGA_MX: 262,
  WC_2026: 1,
};

export const THE_ODDS_API_KEYS: Record<Competition, string> = {
  LIGA_MX: 'soccer_mexico_ligamx',
  // Verify WC 2026 key when tournament opens June 11
  WC_2026: 'soccer_fifa_world_cup',
};

// WC qualifying competitions included when building national team stats windows
export const WC_STAT_COMPETITION_IDS = [
  1,    // FIFA World Cup
  2,    // UEFA Champions League (not used, but valid)
  32,   // World Cup Qualification CONCACAF
  29,   // World Cup Qualification UEFA
  34,   // World Cup Qualification CONMEBOL
  36,   // World Cup Qualification CAF
  30,   // World Cup Qualification AFC
  33,   // World Cup Qualification OFC
  16,   // UEFA Nations League
];

// WC 2022 baseline league averages (used before WC 2026 has match data)
export const WC_BASELINE_LEAGUE_AVERAGES = {
  goalsPerHomeGame: 1.12,
  goalsPerAwayGame: 1.15,
};

// Temporarily using 2024 (free plan limit) — change to 2026 when upgrading
export const LIGA_MX_SEASON = 2024;
