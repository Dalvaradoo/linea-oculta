import { MarketAnalysis } from '@/lib/contracts/analysis';

const MARKET_LABEL: Record<string, string> = {
  MATCH_WINNER:  'Match Winner',
  BTTS:          'Ambos Anotan',
  OVER_UNDER_25: 'Total Goles',
};

function Bar({ label, model, market, edgePct }: { label: string; model: number; market: number; edgePct: number }) {
  const modelPct  = Math.round(model  * 100);
  const marketPct = Math.round(market * 100);
  const isPositive = edgePct > 2;
  const isNegative = edgePct < -2;
  const color = isPositive ? '#00E062' : isNegative ? '#E53935' : '#9A9E9A';

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[14px] font-mono text-[#C8CCC8] truncate max-w-[120px]">{label}</span>
        <span className="text-[14px] font-mono tabular-nums font-semibold" style={{ color }}>
          {edgePct > 0 ? '+' : ''}{edgePct.toFixed(1)}%
        </span>
      </div>
      {/* Model bar */}
      <div className="flex items-center gap-2.5 mb-1.5">
        <span className="text-[11px] font-mono text-[#6B6F6B] w-8 text-right flex-shrink-0">MOD</span>
        <div className="flex-1 h-2 bg-[#1E201E] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${modelPct}%`, backgroundColor: color }}
          />
        </div>
        <span className="text-[13px] font-mono tabular-nums text-[#C8CCC8] w-9 flex-shrink-0">{modelPct}%</span>
      </div>
      {/* Market bar */}
      <div className="flex items-center gap-2.5">
        <span className="text-[11px] font-mono text-[#6B6F6B] w-8 text-right flex-shrink-0">MKT</span>
        <div className="flex-1 h-2 bg-[#1E201E] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-[#3A3E3A] transition-all duration-500"
            style={{ width: `${marketPct}%` }}
          />
        </div>
        <span className="text-[13px] font-mono tabular-nums text-[#6B6F6B] w-9 flex-shrink-0">{marketPct}%</span>
      </div>
    </div>
  );
}

export function ModelVsMarketChart({ markets }: { markets: MarketAnalysis[] }) {
  if (!markets.length) return null;

  return (
    <div className="space-y-6">
      <div className="text-[12px] font-mono text-[#6B6F6B] uppercase tracking-widest">
        Modelo vs Mercado
      </div>
      {markets.map((market) => (
        <div key={market.market}>
          <div className="text-[11px] font-mono text-[#9A9E9A] uppercase tracking-wider mb-3">
            {MARKET_LABEL[market.market] ?? market.market}
          </div>
          {market.picks.map((pick) => (
            <Bar
              key={pick.selection}
              label={pick.selection}
              model={pick.modelProbability}
              market={pick.fairProbability}
              edgePct={pick.edgePct}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
