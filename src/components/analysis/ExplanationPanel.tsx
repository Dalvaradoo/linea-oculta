'use client';

import { useEffect, useState } from 'react';
import { AnalysisResult } from '@/lib/contracts/analysis';
import { Label } from '@/lib/contracts/pick';

const MARKET_LABEL: Record<string, string> = {
  MATCH_WINNER:  'Match Winner',
  BTTS:          'Ambos Anotan',
  OVER_UNDER_25: 'Total Goles',
};

function getBestPick(analysis: AnalysisResult) {
  for (const target of ['VALUE', 'LEAN'] as Label[]) {
    for (const market of analysis.markets) {
      for (const pick of market.picks) {
        if (pick.label === target) return { pick, market: market.market };
      }
    }
  }
  return null;
}

interface Props {
  analysis: AnalysisResult;
  fixtureId: string;
}

export function ExplanationPanel({ analysis, fixtureId }: Props) {
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const best = getBestPick(analysis);

  useEffect(() => {
    if (!best) return;
    try {
      const cached = sessionStorage.getItem(`explain-${fixtureId}`);
      if (cached) { setText(cached); return; }
    } catch {}

    setLoading(true);
    setError(false);
    fetch(`/api/analysis/${fixtureId}/explain?market=${encodeURIComponent(best.market)}&selection=${encodeURIComponent(best.pick.selection)}`)
      .then((r) => r.json())
      .then((json) => {
        const explanation = json.data?.explanation ?? null;
        if (explanation) {
          setText(explanation);
          try { sessionStorage.setItem(`explain-${fixtureId}`, explanation); } catch {}
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fixtureId]);

  if (!best) return null;

  return (
    <div>
      <div className="text-[12px] font-mono text-[#6B6F6B] uppercase tracking-widest mb-3">
        Explicación IA
      </div>

      <div className="mb-3">
        <span className="text-[15px] font-mono text-[#C8CCC8] font-medium">{best.pick.selection}</span>
        <span className="text-[13px] font-mono text-[#6B6F6B]"> · {MARKET_LABEL[best.market] ?? best.market}</span>
      </div>

      {loading && (
        <div className="space-y-2.5">
          {[92, 78, 85, 65].map((w, i) => (
            <div key={i} className="h-2.5 bg-white/[0.06] rounded animate-pulse" style={{ width: `${w}%` }} />
          ))}
        </div>
      )}

      {error && (
        <p className="text-[13px] font-mono text-[#6B6F6B]">Explicación no disponible.</p>
      )}

      {text && !loading && (
        <p className="text-[15px] text-[#B8BCB8] leading-relaxed">{text}</p>
      )}
    </div>
  );
}
