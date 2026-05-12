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
      <div className="text-center py-16">
        <p className="text-[#787878] font-mono text-sm">No hay partidos próximos disponibles.</p>
        <p className="text-[#404040] font-mono text-xs mt-1">Vuelve cuando se acerque la próxima jornada.</p>
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
        <div className="flex items-center gap-2 px-3 py-2 rounded border border-[#00E062]/20 bg-[#00E062]/5 text-[#00E062] text-xs font-mono mb-4">
          <span>●</span>
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
    <main className="max-w-2xl mx-auto px-4 py-8">
      <header className="mb-8">
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-mono font-semibold tracking-tight text-[#F2F2F2]">
            LÍNEA OCULTA
          </h1>
          <span className="text-xs font-mono text-[#404040]">análisis deportivo</span>
        </div>
        <p className="text-xs text-[#787878] mt-1 font-mono">
          Liga MX · Copa del Mundo 2026 · Modelo Poisson v1
        </p>
      </header>

      <section>
        <div className="text-[10px] font-mono text-[#404040] uppercase tracking-widest mb-3">
          Próximos partidos
        </div>
        <Suspense fallback={
          <div className="space-y-3">
            {[1,2,3].map(i => <MatchCardSkeleton key={i} />)}
          </div>
        }>
          <FixtureList />
        </Suspense>
      </section>
    </main>
  );
}
