'use client';

import { MarketAnalysis } from '@/lib/contracts/analysis';
import { LabelBadge } from '@/components/ui/LabelBadge';
import { ConfidenceBadge } from '@/components/ui/ConfidenceBadge';

const MARKET_LABEL: Record<string, string> = {
  MATCH_WINNER:  'Match Winner',
  BTTS:          'Ambos Anotan',
  OVER_UNDER_25: 'Total Goles',
};

function EdgeBar({ edgePct }: { edgePct: number }) {
  const abs = Math.min(Math.abs(edgePct), 40);
  const width = `${(abs / 40) * 100}%`;
  const color = edgePct > 5 ? '#00E062' : edgePct > 2 ? '#F5A623' : edgePct < -2 ? '#E53935' : '#787878';
  return (
    <div className="h-1 w-24 bg-[#1E1E1E] rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-300" style={{ width, backgroundColor: color }} />
    </div>
  );
}

export function MarketBreakdown({ markets }: { markets: MarketAnalysis[] }) {
  if (!markets.length) return null;

  return (
    <div className="space-y-6">
      {markets.map((market) => (
        <div key={market.market}>
          <div className="text-[10px] font-mono text-[#787878] uppercase tracking-widest mb-3">
            {MARKET_LABEL[market.market] ?? market.market}
          </div>

          {/* Table header */}
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-x-4 items-center px-3 py-1 text-[10px] font-mono text-[#404040] uppercase tracking-wider border-b border-[#1E1E1E] mb-1">
            <span>Selección</span>
            <span className="text-right">Momio</span>
            <span className="text-right">P. Impl</span>
            <span className="text-right">P. Justa</span>
            <span className="text-right">Modelo</span>
            <span className="text-right">Edge</span>
          </div>

          {/* Rows */}
          {market.picks.map((pick) => (
            <div
              key={pick.selection}
              className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-x-4 items-center px-3 py-2.5 rounded hover:bg-[#1A1A1A] transition-colors duration-150 group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <LabelBadge label={pick.label} />
                <span className="text-sm text-[#F2F2F2] truncate">{pick.selection}</span>
                <ConfidenceBadge level={pick.confidence} />
              </div>
              <span className="font-mono text-sm text-[#F2F2F2] text-right tabular-nums">
                {pick.oddsAmerican}
              </span>
              <span className="font-mono text-xs text-[#787878] text-right tabular-nums">
                {(pick.impliedProbability * 100).toFixed(1)}%
              </span>
              <span className="font-mono text-xs text-[#787878] text-right tabular-nums">
                {(pick.fairProbability * 100).toFixed(1)}%
              </span>
              <span className="font-mono text-xs text-[#F2F2F2] text-right tabular-nums">
                {(pick.modelProbability * 100).toFixed(1)}%
              </span>
              <div className="flex items-center gap-2 justify-end">
                <EdgeBar edgePct={pick.edgePct} />
                <span
                  className="font-mono text-xs text-right tabular-nums w-14"
                  style={{ color: pick.edgePct > 5 ? '#00E062' : pick.edgePct > 2 ? '#F5A623' : pick.edgePct < -2 ? '#E53935' : '#787878' }}
                >
                  {pick.edgePct > 0 ? '+' : ''}{pick.edgePct.toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
