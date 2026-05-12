'use client';

// Card with minimal-card shadows + shift-card expand pattern
// Adapted from cult-ui: https://github.com/nolly-studio/cult-ui

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { NormalizedFixture } from '@/lib/contracts/fixture';
import { AnalysisResult } from '@/lib/contracts/analysis';
import { LabelBadge } from '@/components/ui/LabelBadge';
import { ConfidenceBadge } from '@/components/ui/ConfidenceBadge';
import { Label, ConfidenceLevel } from '@/lib/contracts/pick';

interface Props {
  fixture: NormalizedFixture;
  analysis?: AnalysisResult | null;
}

function formatKickoff(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('es-MX', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function getBestPick(analysis: AnalysisResult): {
  label: Label; selection: string; oddsAmerican: string;
  confidence: ConfidenceLevel; edgePct: number; market: string;
} | null {
  for (const target of ['VALUE', 'LEAN'] as Label[]) {
    for (const market of analysis.markets) {
      for (const pick of market.picks) {
        if (pick.label === target) {
          return {
            label: pick.label,
            selection: pick.selection,
            oddsAmerican: pick.oddsAmerican,
            confidence: pick.confidence,
            edgePct: pick.edgePct,
            market: market.market,
          };
        }
      }
    }
  }
  return null;
}

const COMPETITION_LABEL: Record<string, string> = {
  LIGA_MX: 'Liga MX',
  WC_2026: 'Copa del Mundo 2026',
};

const MARKET_SHORT: Record<string, string> = {
  MATCH_WINNER: '1X2',
  BTTS: 'Ambos Anotan',
  OVER_UNDER_25: 'Total Goles',
};

// Minimal-card dark shadows from cult-ui
const cardShadow = [
  '0 1px 0 0 rgba(255,255,255,0.03) inset',
  '0 0 0 1px rgba(255,255,255,0.03) inset',
  '0 0 0 1px rgba(0,0,0,0.2)',
  '0 2px 2px 0 rgba(0,0,0,0.15)',
  '0 4px 4px 0 rgba(0,0,0,0.1)',
  '0 8px 16px 0 rgba(0,0,0,0.1)',
].join(', ');

const cardShadowHover = [
  '0 1px 0 0 rgba(255,255,255,0.05) inset',
  '0 0 0 1px rgba(255,255,255,0.05) inset',
  '0 0 0 1px rgba(0,0,0,0.3)',
  '0 4px 8px 0 rgba(0,0,0,0.2)',
  '0 8px 16px 0 rgba(0,0,0,0.15)',
  '0 16px 32px 0 rgba(0,0,0,0.1)',
].join(', ');

export function MatchCard({ fixture, analysis }: Props) {
  const [hovered, setHovered] = useState(false);
  const bestPick = analysis ? getBestPick(analysis) : null;
  const hasData = analysis?.dataAvailability.odds === 'AVAILABLE';

  const allPicks = analysis?.markets.flatMap((m) =>
    m.picks
      .filter((p) => p.label !== 'AVOID')
      .map((p) => ({ ...p, marketShort: MARKET_SHORT[m.market] ?? m.market }))
  ) ?? [];

  return (
    <Link
      href={`/match/${fixture.id}`}
      className="block cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <motion.div
        className="rounded-xl bg-[#141414] p-4 transition-colors"
        animate={{ boxShadow: hovered ? cardShadowHover : cardShadow }}
        transition={{ duration: 0.2 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-mono text-[#787878] uppercase tracking-widest">
            {COMPETITION_LABEL[fixture.competition] ?? fixture.competition}
            {fixture.round ? ` · ${fixture.round}` : ''}
          </span>
          <span className="text-[10px] font-mono text-[#787878]">
            {formatKickoff(fixture.kickoff)}
          </span>
        </div>

        {/* Teams */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <span className="text-sm font-medium text-[#F2F2F2] flex-1">{fixture.homeTeam.name}</span>
          <span className="text-xs font-mono text-[#404040]">vs</span>
          <span className="text-sm font-medium text-[#F2F2F2] flex-1 text-right">{fixture.awayTeam.name}</span>
        </div>

        {/* Best pick row */}
        {!hasData ? (
          <div className="text-[11px] font-mono text-[#404040]">ODDS NOT AVAILABLE</div>
        ) : bestPick ? (
          <div className="flex items-center gap-2">
            <LabelBadge label={bestPick.label} />
            <span className="text-xs text-[#787878]">{bestPick.selection}</span>
            <span className="text-[10px] font-mono text-[#404040]">{MARKET_SHORT[bestPick.market] ?? ''}</span>
            <span className="text-xs font-mono text-[#F2F2F2] ml-auto tabular-nums">{bestPick.oddsAmerican}</span>
            <ConfidenceBadge level={bestPick.confidence} />
          </div>
        ) : (
          <div className="text-[11px] font-mono text-[#404040]">SIN VALOR DETECTADO</div>
        )}

        {/* Shift expand: show all non-AVOID picks on hover */}
        <AnimatePresence>
          {hovered && allPicks.length > 1 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <div className="mt-3 pt-3 border-t border-[#1E1E1E] space-y-1.5">
                {allPicks.slice(0, 4).map((p, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <LabelBadge label={p.label} />
                    <span className="text-[#787878] flex-1">{p.selection}</span>
                    <span className="font-mono text-[#404040] text-[10px]">{p.marketShort}</span>
                    <span
                      className="font-mono tabular-nums text-[10px] w-12 text-right"
                      style={{ color: p.edgePct > 5 ? '#00E062' : p.edgePct > 2 ? '#F5A623' : '#787878' }}
                    >
                      {p.edgePct > 0 ? '+' : ''}{p.edgePct.toFixed(1)}%
                    </span>
                    <span className="font-mono text-[#F2F2F2] tabular-nums">{p.oddsAmerican}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </Link>
  );
}
