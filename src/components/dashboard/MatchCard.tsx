'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
  return new Date(date).toLocaleDateString('es-MX', {
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
          return { label: pick.label, selection: pick.selection, oddsAmerican: pick.oddsAmerican, confidence: pick.confidence, edgePct: pick.edgePct, market: market.market };
        }
      }
    }
  }
  return null;
}

const MARKET_SHORT: Record<string, string> = {
  MATCH_WINNER: '1X2',
  BTTS: 'Ambos anotan',
  OVER_UNDER_25: 'Total goles',
};

const COMPETITION_LABEL: Record<string, string> = {
  LIGA_MX: 'Liga MX',
  WC_2026: 'Copa del Mundo 2026',
};

function TeamLogo({ src, name }: { src?: string; name: string }) {
  if (!src) {
    return (
      <div className="w-10 h-10 rounded-full bg-[#2A2A2A] flex items-center justify-center text-[18px] font-mono text-[#9A9E9A]">
        {name.slice(0, 2).toUpperCase()}
      </div>
    );
  }
  return (
    <div className="w-10 h-10 rounded-full bg-[#1E201E] overflow-hidden flex items-center justify-center flex-shrink-0">
      <Image src={src} alt={name} width={36} height={36} className="object-contain" />
    </div>
  );
}

export function MatchCard({ fixture, analysis }: Props) {
  const [hovered, setHovered] = useState(false);
  const bestPick = analysis ? getBestPick(analysis) : null;
  const hasData = analysis?.dataAvailability.odds === 'AVAILABLE';
  const isValue = bestPick?.label === 'VALUE';
  const isLean = bestPick?.label === 'LEAN';

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
        className="rounded-xl overflow-hidden"
        animate={{
          boxShadow: hovered
            ? isValue
              ? '0 0 0 1px rgba(0,224,98,0.40), 0 8px 40px rgba(0,224,98,0.12), 0 4px 16px rgba(0,0,0,0.5)'
              : '0 0 0 1px rgba(255,255,255,0.12), 0 8px 40px rgba(0,0,0,0.4)'
            : isValue
              ? '0 0 0 1px rgba(0,224,98,0.20), 0 4px 20px rgba(0,224,98,0.06), 0 2px 8px rgba(0,0,0,0.4)'
              : '0 0 0 1px rgba(255,255,255,0.07), 0 2px 12px rgba(0,0,0,0.3)',
        }}
        transition={{ duration: 0.2 }}
      >
        {/* Accent bar */}
        {isValue && <div className="h-0.5 w-full bg-gradient-to-r from-[#00E062] to-[#00E062]/10" />}
        {isLean  && <div className="h-0.5 w-full bg-gradient-to-r from-[#F5A623] to-[#F5A623]/10" />}

        <div className={`p-4 md:p-5 ${isValue ? 'glass-value' : 'glass'}`}>
          {/* Competition + time */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-[12px] font-mono text-[#9A9E9A] uppercase tracking-widest">
              {COMPETITION_LABEL[fixture.competition] ?? fixture.competition}
              {fixture.round ? ` · ${fixture.round}` : ''}
            </span>
            <span className="text-[17px] font-mono text-[#6B6F6B]">
              {formatKickoff(fixture.kickoff)}
            </span>
          </div>

          {/* Teams */}
          <div className="flex items-center gap-4 mb-5">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <TeamLogo src={fixture.homeTeam.logo} name={fixture.homeTeam.name} />
              <span className="text-[17px] font-semibold text-[#F0F2F0] truncate leading-tight">
                {fixture.homeTeam.name}
              </span>
            </div>
            <span className="text-[18px] font-mono text-[#3A3E3A] flex-shrink-0">vs</span>
            <div className="flex items-center gap-3 flex-1 min-w-0 flex-row-reverse">
              <TeamLogo src={fixture.awayTeam.logo} name={fixture.awayTeam.name} />
              <span className="text-[17px] font-semibold text-[#F0F2F0] truncate text-right leading-tight">
                {fixture.awayTeam.name}
              </span>
            </div>
          </div>

          {/* Pick or status */}
          {!hasData ? (
            <div className="text-[18px] font-mono text-[#6B6F6B]">Sin cuotas disponibles</div>
          ) : bestPick ? (
            <div className="flex items-center gap-3">
              <LabelBadge label={bestPick.label} />
              <span className="text-[18px] text-[#D0D4D0] font-medium">{bestPick.selection}</span>
              <span className="text-[17px] font-mono text-[#6B6F6B]">
                {MARKET_SHORT[bestPick.market] ?? ''}
              </span>
              <div className="ml-auto flex items-center gap-3">
                <span className={`text-[17px] font-mono font-bold tabular-nums ${isValue ? 'text-[#00E062]' : 'text-[#F0F2F0]'}`}>
                  {bestPick.oddsAmerican}
                </span>
                <ConfidenceBadge level={bestPick.confidence} />
              </div>
            </div>
          ) : (
            <div className="text-[18px] font-mono text-[#6B6F6B]">Sin valor detectado</div>
          )}

          {/* Expand on hover */}
          <AnimatePresence>
            {hovered && allPicks.length > 1 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="overflow-hidden"
              >
                <div className="mt-4 pt-4 border-t border-[#1E201E] space-y-2.5">
                  {allPicks.slice(0, 4).map((p, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <LabelBadge label={p.label} />
                      <span className="text-[17px] text-[#9A9E9A] flex-1">{p.selection}</span>
                      <span className="font-mono text-[17px] text-[#6B6F6B]">{p.marketShort}</span>
                      <span
                        className="font-mono tabular-nums text-[18px] w-14 text-right font-medium"
                        style={{ color: p.edgePct > 5 ? '#00E062' : p.edgePct > 2 ? '#F5A623' : '#6B6F6B' }}
                      >
                        {p.edgePct > 0 ? '+' : ''}{p.edgePct.toFixed(1)}%
                      </span>
                      <span className="font-mono text-[18px] text-[#F0F2F0] tabular-nums font-semibold">{p.oddsAmerican}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </Link>
  );
}
