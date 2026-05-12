import { Label, GuardrailFlags } from '@/lib/contracts/pick';
import { anyGuardrailActive } from './guardrails';

export function assignLabel(edgePct: number, flags: GuardrailFlags): Label {
  // Guardrails have absolute precedence — override any edge calculation
  if (anyGuardrailActive(flags)) return 'AVOID';

  if (edgePct > 5) return 'VALUE';
  if (edgePct > 2) return 'LEAN';
  if (edgePct >= -2) return 'FAIR';
  return 'AVOID';
}
