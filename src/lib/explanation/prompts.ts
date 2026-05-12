import { PickAnalysis } from '@/lib/contracts/analysis';
import { Label, ReasonCode } from '@/lib/contracts/pick';

const LABEL_CONTEXT: Record<Label, string> = {
  VALUE:  'el modelo detecta valor claro — la probabilidad estimada supera significativamente la probabilidad justa del mercado',
  LEAN:   'el modelo detecta valor marginal — hay una pequeña diferencia a favor, pero no suficientemente fuerte',
  FAIR:   'el mercado parece correctamente valuado — el modelo no detecta ventaja significativa',
  AVOID:  'el modelo recomienda pasar — el mercado ofrece peor valor del que indica la probabilidad real estimada',
};

const REASON_LABELS: Partial<Record<ReasonCode, string>> = {
  POSITIVE_EDGE:             'edge positivo claro',
  LOW_EDGE:                  'edge marginalmente positivo',
  MARKET_MODEL_DIVERGENCE:   'divergencia entre mercado y modelo',
  INSUFFICIENT_DATA:         'datos insuficientes para esta temporada',
  HIGH_RISK_EDGE:            'edge extremadamente alto (posible error del modelo)',
  WC_LIMITED_DATA:           'equipo nacional con historial limitado',
  MODEL_UNCERTAINTY:         'incertidumbre en el modelo',
};

export function buildExplainPrompt(
  homeTeam: string,
  awayTeam: string,
  competition: string,
  pick: PickAnalysis,
  market: string
): string {
  const reasonDescriptions = pick.reasonCodes
    .map((r) => REASON_LABELS[r])
    .filter(Boolean)
    .join(', ');

  const marketLabel: Record<string, string> = {
    MATCH_WINNER:  'resultado del partido (1X2)',
    BTTS:          'ambos equipos anotan',
    OVER_UNDER_25: 'total de goles over/under 2.5',
  };

  return `Eres un analista deportivo sobrio y técnico. Explica en 2-3 oraciones, en español, por qué el modelo estadístico llegó a esta conclusión para el partido ${homeTeam} vs ${awayTeam} (${competition}).

Mercado: ${marketLabel[market] ?? market}
Selección: ${pick.selection}
Momio americano: ${pick.oddsAmerican} (decimal: ${pick.odds.toFixed(2)})
Probabilidad implícita del mercado: ${(pick.impliedProbability * 100).toFixed(1)}%
Probabilidad justa (sin vigorish): ${(pick.fairProbability * 100).toFixed(1)}%
Probabilidad estimada por el modelo: ${(pick.modelProbability * 100).toFixed(1)}%
Edge: ${pick.edgePct > 0 ? '+' : ''}${pick.edgePct.toFixed(1)}%
Clasificación: ${pick.label} — ${LABEL_CONTEXT[pick.label]}
Razones: ${reasonDescriptions || 'cálculo estándar del modelo'}
Confianza: ${pick.confidence}

Reglas estrictas:
- Tono analítico, frío, técnico. No entusiasta.
- NO prometer ganancias ni usar lenguaje de "apuesta segura".
- NO decir "recomendamos apostar" ni variantes.
- SÍ explicar el razonamiento matemático en términos simples.
- Máximo 3 oraciones. Sin viñetas ni listas.
- Solo el texto explicativo, sin encabezados ni saludos.`;
}
