'use client';

import React from 'react';
import { MarketAnalysis } from '@/lib/contracts/analysis';
import { LabelBadge } from '@/components/ui/LabelBadge';
import { ConfidenceBadge } from '@/components/ui/ConfidenceBadge';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';

const MARKET_LABEL: Record<string, string> = {
  MATCH_WINNER:  'Match Winner',
  BTTS:          'Ambos Anotan',
  OVER_UNDER_25: 'Total Goles',
};

function EdgeBar({ edgePct }: { edgePct: number }) {
  const abs = Math.min(Math.abs(edgePct), 40);
  const width = `${(abs / 40) * 100}%`;
  const color = edgePct > 5 ? '#00E062' : edgePct > 2 ? '#F5A623' : edgePct < -2 ? '#E53935' : '#3A3E3A';
  return (
    <div className="h-1.5 w-16 bg-white/[0.06] rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-300" style={{ width, backgroundColor: color }} />
    </div>
  );
}

function edgeColor(edgePct: number): string {
  return edgePct > 5 ? '#00E062' : edgePct > 2 ? '#F5A623' : edgePct < -2 ? '#E53935' : '#6B6F6B';
}

export function MarketBreakdown({ markets }: { markets: MarketAnalysis[] }) {
  if (!markets.length) return null;

  return (
    <div className="space-y-8">
      {markets.map((market) => (
        <div key={market.market}>
          <div className="text-xs font-mono text-[#9A9E9A] uppercase tracking-widest mb-4">
            {MARKET_LABEL[market.market] ?? market.market}
          </div>

          {/* ── DESKTOP TABLE (md+) ── */}
          <div className="hidden md:block">
            {/* Header */}
            <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto_auto] gap-x-5 items-center px-4 py-2 text-[12px] font-mono text-[#6B6F6B] uppercase tracking-wider border-b border-white/[0.07] mb-1">
              <span>Selección</span>
              <span className="text-right">Momio</span>
              <span className="text-right">P. Impl</span>
              <span className="text-right">P. Justa</span>
              <span className="text-right">Modelo</span>
              <span className="text-right">Edge</span>
              <span className="text-right">Kelly ½</span>
            </div>
            {/* Rows */}
            {market.picks.map((pick) => (
              <div
                key={pick.selection}
                className="grid grid-cols-[1fr_auto_auto_auto_auto_auto_auto] gap-x-5 items-center px-4 py-3.5 rounded-lg hover:bg-white/[0.04] transition-colors duration-150"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <LabelBadge label={pick.label} />
                  <span className="text-[17px] text-[#E8ECE8] truncate">{pick.selection}</span>
                  <ConfidenceBadge level={pick.confidence} />
                </div>
                <span className="font-mono text-[17px] font-semibold text-[#F0F2F0] text-right tabular-nums">
                  {pick.oddsAmerican}
                </span>
                <AnimatedNumber
                  value={pick.impliedProbability * 100}
                  format={(n) => `${n.toFixed(1)}%`}
                  className="font-mono text-[18px] text-[#9A9E9A] text-right tabular-nums block"
                />
                <AnimatedNumber
                  value={pick.fairProbability * 100}
                  format={(n) => `${n.toFixed(1)}%`}
                  className="font-mono text-[18px] text-[#9A9E9A] text-right tabular-nums block"
                />
                <AnimatedNumber
                  value={pick.modelProbability * 100}
                  format={(n) => `${n.toFixed(1)}%`}
                  className="font-mono text-[18px] text-[#E8ECE8] text-right tabular-nums block font-medium"
                />
                <div className="flex items-center gap-2 justify-end">
                  <EdgeBar edgePct={pick.edgePct} />
                  <AnimatedNumber
                    value={pick.edgePct}
                    format={(n) => `${n > 0 ? '+' : ''}${n.toFixed(1)}%`}
                    className="font-mono text-[18px] text-right tabular-nums w-14 block font-medium"
                    style={{ color: edgeColor(pick.edgePct) } as React.CSSProperties}
                  />
                </div>
                <div className="text-right">
                  {pick.kellyHalf > 0 ? (
                    <span
                      className="font-mono text-[17px] tabular-nums font-semibold"
                      style={{ color: edgeColor(pick.edgePct) }}
                    >
                      {(pick.kellyHalf * 100).toFixed(1)}%
                    </span>
                  ) : (
                    <span className="font-mono text-[17px] text-[#3A3E3A]">—</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* ── MOBILE CARDS (< md) ── */}
          <div className="md:hidden space-y-2">
            {market.picks.map((pick) => (
              <div
                key={pick.selection}
                className="rounded-xl bg-white/[0.04] border border-white/[0.07] px-4 py-3.5"
              >
                {/* Row 1: label + name + confidence */}
                <div className="flex items-center gap-2 mb-3">
                  <LabelBadge label={pick.label} />
                  <span className="text-[18px] text-[#E8ECE8] font-medium flex-1 min-w-0 truncate">
                    {pick.selection}
                  </span>
                  <ConfidenceBadge level={pick.confidence} />
                </div>
                {/* Row 2: odds | model | edge | kelly */}
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <div className="text-[11px] font-mono text-[#6B6F6B] uppercase tracking-wider mb-0.5">Momio</div>
                    <div className="text-[17px] font-mono font-bold text-[#F0F2F0] tabular-nums">
                      {pick.oddsAmerican}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-mono text-[#6B6F6B] uppercase tracking-wider mb-0.5">Modelo</div>
                    <div className="text-[17px] font-mono font-semibold text-[#E8ECE8] tabular-nums">
                      {(pick.modelProbability * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-mono text-[#6B6F6B] uppercase tracking-wider mb-0.5">Edge</div>
                    <div
                      className="text-[17px] font-mono font-bold tabular-nums"
                      style={{ color: edgeColor(pick.edgePct) }}
                    >
                      {pick.edgePct > 0 ? '+' : ''}{pick.edgePct.toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-mono text-[#6B6F6B] uppercase tracking-wider mb-0.5">Kelly ½</div>
                    <div
                      className="text-[17px] font-mono font-bold tabular-nums"
                      style={{ color: pick.kellyHalf > 0 ? edgeColor(pick.edgePct) : '#3A3E3A' }}
                    >
                      {pick.kellyHalf > 0 ? `${(pick.kellyHalf * 100).toFixed(1)}%` : '—'}
                    </div>
                  </div>
                </div>
                {/* Edge bar */}
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(Math.abs(pick.edgePct), 40) / 40 * 100}%`,
                        backgroundColor: edgeColor(pick.edgePct),
                      }}
                    />
                  </div>
                  <span className="text-[18px] font-mono text-[#6B6F6B]">
                    mkt {(pick.fairProbability * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>

        </div>
      ))}
    </div>
  );
}
