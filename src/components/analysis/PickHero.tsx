import Image from 'next/image';
import { AnalysisResult } from '@/lib/contracts/analysis';
import { NormalizedFixture } from '@/lib/contracts/fixture';
import { LabelBadge } from '@/components/ui/LabelBadge';
import { ConfidenceBadge } from '@/components/ui/ConfidenceBadge';
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
  fixture: NormalizedFixture;
  analysis: AnalysisResult;
}

export function PickHero({ fixture, analysis }: Props) {
  const best = getBestPick(analysis);
  if (!best) return null;

  const { pick, market } = best;
  const isValue = pick.label === 'VALUE';

  return (
    <div className={`rounded-2xl p-5 md:p-7 mb-6 md:mb-8 ${isValue ? 'glass-value border-gradient-value' : 'glass-lean'}`}>

      {/* Teams — row on desktop, stacked on mobile */}
      <div className="flex items-center justify-between mb-5 md:mb-7 gap-2">
        {/* Home */}
        <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
          {fixture.homeTeam.logo && (
            <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-[#1E201E] overflow-hidden flex items-center justify-center flex-shrink-0">
              <Image src={fixture.homeTeam.logo} alt={fixture.homeTeam.name} width={50} height={50} className="object-contain" />
            </div>
          )}
          <span className="text-[19px] md:text-[18px] font-semibold text-[#F0F2F0] leading-tight truncate">
            {fixture.homeTeam.name}
          </span>
        </div>

        <span className="text-[12px] font-mono text-[#6B6F6B] flex-shrink-0 px-1">vs</span>

        {/* Away */}
        <div className="flex items-center gap-2 md:gap-3 flex-row-reverse min-w-0 flex-1">
          {fixture.awayTeam.logo && (
            <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-[#1E201E] overflow-hidden flex items-center justify-center flex-shrink-0">
              <Image src={fixture.awayTeam.logo} alt={fixture.awayTeam.name} width={50} height={50} className="object-contain" />
            </div>
          )}
          <span className="text-[19px] md:text-[18px] font-semibold text-[#F0F2F0] leading-tight truncate text-right">
            {fixture.awayTeam.name}
          </span>
        </div>
      </div>

      {/* Pick — stacks on mobile */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <LabelBadge label={pick.label} />
            <span className="text-[12px] font-mono text-[#9A9E9A] uppercase tracking-wider">
              {MARKET_LABEL[market] ?? market}
            </span>
          </div>
          <div className="text-[20px] md:text-[24px] font-semibold text-[#F0F2F0] mb-2 leading-tight">
            {pick.selection}
          </div>
          <div className="flex items-center gap-2">
            <ConfidenceBadge level={pick.confidence} />
            <span className="text-[19px] font-mono text-[#9A9E9A]">{pick.confidence} confidence</span>
          </div>
        </div>

        <div className="flex md:flex-col md:text-right items-center md:items-end gap-4 md:gap-0">
          <div className={`text-[44px] md:text-[52px] font-mono font-bold tabular-nums leading-none ${isValue ? 'text-[#00E062]' : 'text-[#F5A623]'}`}>
            {pick.oddsAmerican}
          </div>
          <div className="md:mt-2">
            <div
              className="text-[18px] md:text-[19px] font-mono tabular-nums font-semibold"
              style={{ color: pick.edgePct > 5 ? '#00E062' : pick.edgePct > 2 ? '#F5A623' : '#9A9E9A' }}
            >
              {pick.edgePct > 0 ? '+' : ''}{pick.edgePct.toFixed(1)}% edge
            </div>
            <div className="text-[18px] md:text-[19px] font-mono text-[#6B6F6B] mt-0.5">
              modelo {(pick.modelProbability * 100).toFixed(1)}% · mercado {(pick.fairProbability * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
