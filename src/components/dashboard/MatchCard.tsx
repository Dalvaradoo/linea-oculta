import Link from 'next/link';
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

function getBestPick(analysis: AnalysisResult): { label: Label; selection: string; oddsAmerican: string; confidence: ConfidenceLevel } | null {
  const order: Label[] = ['VALUE', 'LEAN', 'FAIR', 'AVOID'];
  for (const target of order) {
    for (const market of analysis.markets) {
      for (const pick of market.picks) {
        if (pick.label === target && target !== 'AVOID') {
          return { label: pick.label, selection: pick.selection, oddsAmerican: pick.oddsAmerican, confidence: pick.confidence };
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

export function MatchCard({ fixture, analysis }: Props) {
  const bestPick = analysis ? getBestPick(analysis) : null;
  const hasData = analysis?.dataAvailability.odds === 'AVAILABLE';

  return (
    <Link
      href={`/match/${fixture.id}`}
      className="block rounded-lg border border-[#2A2A2A] bg-[#141414] p-4 hover:border-[#404040] hover:bg-[#1A1A1A] transition-colors duration-200 cursor-pointer"
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
      <div className="flex items-center justify-between gap-3 mb-4">
        <span className="text-sm font-medium text-[#F2F2F2] flex-1">{fixture.homeTeam.name}</span>
        <span className="text-xs font-mono text-[#404040]">vs</span>
        <span className="text-sm font-medium text-[#F2F2F2] flex-1 text-right">{fixture.awayTeam.name}</span>
      </div>

      {/* Best pick or status */}
      {!hasData ? (
        <div className="text-[11px] font-mono text-[#404040]">ODDS NOT AVAILABLE</div>
      ) : bestPick ? (
        <div className="flex items-center gap-2">
          <LabelBadge label={bestPick.label} />
          <span className="text-xs text-[#787878]">{bestPick.selection}</span>
          <span className="text-xs font-mono text-[#F2F2F2] ml-auto">{bestPick.oddsAmerican}</span>
          <ConfidenceBadge level={bestPick.confidence} />
        </div>
      ) : (
        <div className="text-[11px] font-mono text-[#404040]">SIN VALOR DETECTADO</div>
      )}
    </Link>
  );
}
