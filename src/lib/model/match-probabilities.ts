export interface MatchProbabilities {
  home: number;
  draw: number;
  away: number;
  bttsYes: number;
  bttsNo: number;
  over25: number;
  under25: number;
}

export function deriveMatchProbabilities(matrix: number[][]): MatchProbabilities {
  let home = 0, draw = 0, away = 0;
  let bttsYes = 0;
  let over25 = 0;

  for (let h = 0; h < matrix.length; h++) {
    for (let a = 0; a < matrix[h].length; a++) {
      const p = matrix[h][a];
      if (h > a) home += p;
      else if (h === a) draw += p;
      else away += p;

      if (h > 0 && a > 0) bttsYes += p;
      if (h + a > 2.5) over25 += p;
    }
  }

  return {
    home,
    draw,
    away,
    bttsYes,
    bttsNo: 1 - bttsYes,
    over25,
    under25: 1 - over25,
  };
}
