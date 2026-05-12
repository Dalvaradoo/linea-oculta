// Raw types from The Odds API v4

export interface ApiOddsEvent {
  id: string;
  sport_key: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: ApiBookmaker[];
}

export interface ApiBookmaker {
  key: string;
  title: string;
  markets: ApiMarket[];
}

export interface ApiMarket {
  key: string;   // 'h2h' | 'totals' | 'btts'
  outcomes: ApiOutcome[];
}

export interface ApiOutcome {
  name: string;   // 'Home' | 'Away' | 'Draw' | 'Over' | 'Under' | 'Yes' | 'No'
  price: number;  // decimal odds
  point?: number; // for totals: 2.5
}
