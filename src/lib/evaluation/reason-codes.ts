import { ReasonCode, Label, GuardrailFlags } from '@/lib/contracts/pick';

export function buildReasonCodes(
  edgePct: number,
  label: Label,
  flags: GuardrailFlags
): ReasonCode[] {
  const codes: ReasonCode[] = [];

  if (flags.oddsNotAvailable) codes.push('ODDS_NOT_AVAILABLE');
  if (flags.insufficientData) codes.push('INSUFFICIENT_DATA');
  if (flags.highRiskEdge) codes.push('HIGH_RISK_EDGE');
  if (flags.marketModelDivergence) codes.push('MARKET_MODEL_DIVERGENCE');
  if (flags.wcLimitedData) codes.push('WC_LIMITED_DATA');

  const guardrailActive = Object.values(flags).some(Boolean);
  if (guardrailActive) {
    codes.push('GUARDRAIL_TRIGGERED');
    return codes;
  }

  if (edgePct > 5) codes.push('POSITIVE_EDGE');
  else if (edgePct > 2) codes.push('LOW_EDGE');
  else if (edgePct < -2) codes.push('MODEL_UNCERTAINTY');

  return codes;
}
