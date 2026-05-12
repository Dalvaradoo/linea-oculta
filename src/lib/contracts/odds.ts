import { MarketType, EXPECTED_SELECTIONS } from './pick';

export type OddsSelectionLabel =
  | 'Home'
  | 'Draw'
  | 'Away'
  | 'Yes'
  | 'No'
  | 'Over 2.5'
  | 'Under 2.5';

export interface OddsSelection {
  label: OddsSelectionLabel;
  odds: number;
  impliedProbability: number;
  fairProbability: number;
}

export interface OddsMarket {
  type: MarketType;
  selections: OddsSelection[];
  overround: number;
}

export interface NormalizedOdds {
  fixtureId: string;
  provider: 'the-odds-api' | 'api-football';
  retrievedAt: Date;
  bookmakers: string[];
  markets: {
    matchWinner?: OddsMarket;
    bothTeamsScore?: OddsMarket;
    overUnder25?: OddsMarket;
  };
  availability: 'AVAILABLE' | 'PARTIALLY_AVAILABLE' | 'NOT_AVAILABLE';
}

export { EXPECTED_SELECTIONS };
