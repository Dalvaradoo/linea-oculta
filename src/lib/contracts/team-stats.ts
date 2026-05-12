import { Competition, DataAvailability } from './pick';

export interface LeagueAverages {
  goalsPerHomeGame: number;
  goalsPerAwayGame: number;
}

export interface NormalizedTeamStats {
  teamId: string;
  season: number;
  competitionsIncluded: string[];
  primaryCompetition: Competition;
  gamesPlayed: { home: number; away: number; total: number };
  goalsScored: { home: number; away: number; total: number };
  goalsConceded: { home: number; away: number; total: number };
  goalsPerGame: { home: number; away: number; total: number };
  concededPerGame: { home: number; away: number; total: number };
  leagueAverages: LeagueAverages;
  dataQuality: DataAvailability;
  retrievedAt: Date;
}
