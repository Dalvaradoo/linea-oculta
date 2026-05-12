'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AnalysisResult } from '@/lib/contracts/analysis';
import { ModelVsMarketChart } from '@/components/analysis/ModelVsMarketChart';
import { ExplanationPanel } from '@/components/analysis/ExplanationPanel';

const panelBase = 'border-l border-white/[0.07] backdrop-blur-sm';
const panelBg   = { background: 'rgba(7,9,15,0.55)' };

export function RightPanel() {
  const pathname = usePathname();
  const fixtureId = pathname.startsWith('/match/') ? pathname.split('/match/')[1] : null;

  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!fixtureId) { setAnalysis(null); return; }
    setLoading(true);
    fetch(`/api/analysis/${fixtureId}`)
      .then((r) => r.json())
      .then((json) => setAnalysis(json.data ?? null))
      .catch(() => setAnalysis(null))
      .finally(() => setLoading(false));
  }, [fixtureId]);

  if (!fixtureId) {
    return (
      <aside className={`${panelBase} flex items-center justify-center`} style={panelBg}>
        <p className="text-[19px] font-mono text-white/20 text-center px-6 leading-relaxed">
          Selecciona un<br />partido para ver<br />el análisis
        </p>
      </aside>
    );
  }

  if (loading) {
    return (
      <aside className={`${panelBase} p-5`} style={panelBg}>
        <div className="space-y-5 animate-pulse">
          <div className="h-2.5 w-20 bg-white/[0.06] rounded" />
          {[1,2,3].map(i => (
            <div key={i} className="space-y-2">
              <div className="h-2 bg-white/[0.06] rounded" style={{ width: `${50+i*12}%` }} />
              <div className="h-1.5 bg-white/[0.04] rounded w-full" />
              <div className="h-1.5 bg-white/[0.04] rounded" style={{ width: '80%' }} />
            </div>
          ))}
          <div className="border-t border-white/[0.06] pt-5 space-y-2">
            <div className="h-2.5 w-24 bg-white/[0.06] rounded" />
            {[1,2,3].map(i => <div key={i} className="h-2 bg-white/[0.06] rounded" style={{ width: `${60+i*10}%` }} />)}
          </div>
        </div>
      </aside>
    );
  }

  if (!analysis || !analysis.markets.length) {
    return (
      <aside className={`${panelBase} flex items-center justify-center`} style={panelBg}>
        <p className="text-[19px] font-mono text-white/20 text-center">Sin datos de análisis</p>
      </aside>
    );
  }

  return (
    <aside className={`${panelBase} overflow-y-auto`} style={panelBg}>
      <div className="p-5 space-y-6">
        <ModelVsMarketChart markets={analysis.markets} />
        <div className="border-t border-white/[0.06]" />
        <ExplanationPanel analysis={analysis} fixtureId={fixtureId} />
      </div>
    </aside>
  );
}
