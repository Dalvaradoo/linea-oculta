import { Suspense } from 'react';
import { getFixturesForAllCompetitions } from '@/services/fixtures';
import { getOdds } from '@/services/odds';
import { getTeamStats } from '@/services/team-stats';
import { runAnalysis } from '@/lib/analysis/run';
import { MatchCard } from '@/components/dashboard/MatchCard';
import { MatchCardSkeleton } from '@/components/ui/Skeleton';
import { AnalysisResult } from '@/lib/contracts/analysis';
import { NormalizedFixture } from '@/lib/contracts/fixture';

async function fetchAnalysis(fixture: NormalizedFixture): Promise<AnalysisResult | null> {
  try {
    const [odds, homeStats, awayStats] = await Promise.all([
      getOdds(fixture),
      getTeamStats(fixture.homeTeam.id, fixture.competition),
      getTeamStats(fixture.awayTeam.id, fixture.competition),
    ]);
    return runAnalysis(fixture, odds, homeStats, awayStats);
  } catch {
    return null;
  }
}

async function FixtureList() {
  const fixtures = await getFixturesForAllCompetitions();

  if (!fixtures.length) {
    return (
      <div className="text-center py-20">
        <p className="text-[#9A9E9A] font-mono text-[18px]">No hay partidos próximos disponibles.</p>
        <p className="text-[#6B6F6B] font-mono text-[17px] mt-1">Vuelve cuando se acerque la próxima jornada.</p>
      </div>
    );
  }

  const withAnalysis = await Promise.all(
    fixtures.map(async (f) => ({ fixture: f, analysis: await fetchAnalysis(f) }))
  );

  const hasValue = withAnalysis.some((x) =>
    x.analysis?.markets.some((m) => m.picks.some((p) => p.label === 'VALUE'))
  );

  return (
    <div className="space-y-3">
      {hasValue && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#00E062]/20 bg-[#00E062]/5 text-[#00E062] text-[17px] font-mono mb-5">
          <span className="text-[8px]">●</span>
          <span>Hay picks VALUE disponibles hoy</span>
        </div>
      )}
      {withAnalysis.map(({ fixture, analysis }) => (
        <MatchCard key={fixture.id} fixture={fixture} analysis={analysis} />
      ))}
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="px-4 py-5 md:px-6 md:py-6">
      <header className="mb-8">
        <div className="flex items-baseline gap-3">
          <h1 className="text-[18px] font-mono font-semibold tracking-tight text-[#F0F2F0]">
            Próximos partidos
          </h1>
        </div>
        <p className="text-[17px] text-[#9A9E9A] mt-1 font-mono">
          Modelo Poisson v1 · Liga MX · Copa del Mundo 2026
        </p>
      </header>

      <Suspense fallback={
        <div className="space-y-3">
          {[1,2,3].map(i => <MatchCardSkeleton key={i} />)}
        </div>
      }>
        <FixtureList />
      </Suspense>
    </div>
  );
}
