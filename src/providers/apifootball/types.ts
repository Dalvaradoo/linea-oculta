// Raw types from apiv3.apifootball.com

export interface ApifbEvent {
  match_id: string;
  match_date: string;
  match_time: string;
  match_hometeam_id: string;
  match_hometeam_name: string;
  match_awayteam_id: string;
  match_awayteam_name: string;
  match_hometeam_score: string;
  match_awayteam_score: string;
  match_status: string;
  league_id: string;
  league_name: string;
  league_round: string;
  team_home_badge: string;
  team_away_badge: string;
  match_stadium: string;
}

export interface ApifbStanding {
  country_name: string;
  league_id: string;
  league_name: string;
  team_id: string;
  team_name: string;
  team_badge: string;
  overall_league_position: string;
  overall_league_payed: string;
  overall_league_GF: string;
  overall_league_GA: string;
  home_league_payed: string;
  home_league_GF: string;
  home_league_GA: string;
  away_league_payed: string;
  away_league_GF: string;
  away_league_GA: string;
  league_round: string;
}

export interface ApifbErrorResponse {
  error: number;
  message: string;
}
