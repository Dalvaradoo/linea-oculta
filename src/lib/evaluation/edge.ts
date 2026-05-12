export interface EdgeResult {
  edge: number;
  edgePct: number;
}

export function calculateEdge(
  modelProbability: number,
  fairProbability: number
): EdgeResult {
  if (fairProbability <= 0) throw new Error('fairProbability must be > 0');
  const edge = modelProbability - fairProbability;
  const edgePct = (edge / fairProbability) * 100;
  return { edge, edgePct };
}
