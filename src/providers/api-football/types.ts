// Raw types from API-Football v3 — never used outside this provider

export interface ApiFootballResponse<T> {
  get: string;
  parameters: Record<string, string>;
  errors: Record<string, string>;
  results: number;
  paging: { current: number; total: number };
  response: T[];
}

export interface ApiFixture {
  fixture: {
    id: number;
    date: string;
    venue: { name: string | null };
    status: { short: string };
  };
  league: {
    id: number;
    name: string;
    season: number;
    round: string;
  };
  teams: {
    home: { id: number; name: string; logo: string };
    away: { id: number; name: string; logo: string };
  };
}

export interface ApiTeamStatistics {
  league: { id: number; season: number };
  team: { id: number; name: string };
  fixtures: {
    played: { home: number; away: number; total: number };
  };
  goals: {
    for: {
      average: { home: string; away: string; total: string };
      total: { home: number; away: number; total: number };
    };
    against: {
      average: { home: string; away: string; total: string };
      total: { home: number; away: number; total: number };
    };
  };
}

export interface ApiOdds {
  fixture: { id: number };
  bookmakers: {
    id: number;
    name: string;
    bets: {
      id: number;
      name: string;
      values: { value: string; odd: string }[];
    }[];
  }[];
}
