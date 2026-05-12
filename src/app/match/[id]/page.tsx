import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getFixturesForAllCompetitions } from '@/services/fixtures';
import { getOdds } from '@/services/odds';
import { getTeamStats } from '@/services/team-stats';
import { runAnalysis } from '@/lib/analysis/run';
import { MarketBreakdown } from '@/components/analysis/MarketBreakdown';
import { TracePanel } from '@/components/analysis/TracePanel';
import { DataUnavailable } from '@/components/ui/DataUnavailable';

type Params = { params: Promise<{ id: string }> };

function formatKickoff(date: Date | string): string {
  return new Date(date).toLocaleDateString('es-MX', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

const COMPETITION_LABEL: Record<string, string> = {
  LIGA_MX: 'Liga MX',
  WC_2026: 'Copa del Mundo 2026',
};

export default async function MatchPage({ params }: Params) {
  const { id } = await params;

  const fixtures = await getFixturesForAllCompetitions();
  const fixture = fixtures.find((f) => f.id === id);
  if (!fixture) notFound();

  const [odds, homeStats, awayStats] = await Promise.all([
    getOdds(fixture),
    getTeamStats(fixture.homeTeam.id, fixture.competition),
    getTeamStats(fixture.awayTeam.id, fixture.competition),
  ]);

  const analysis = runAnalysis(fixture, odds, homeStats, awayStats);

  const oddsUnavailable = analysis.dataAvailability.odds === 'NOT_AVAILABLE';
  const statsInsufficient =
    analysis.dataAvailability.homeStats === 'INSUFFICIENT' ||
    analysis.dataAvailability.awayStats === 'INSUFFICIENT';

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      {/* Back */}
      <Link href="/" className="inline-flex items-center gap-1 text-xs font-mono text-[#787878] hover:text-[#F2F2F2] transition-colors mb-6 cursor-pointer">
        ← Volver
      </Link>

      {/* Match header */}
      <div className="mb-8">
        <div className="text-[10px] font-mono text-[#787878] uppercase tracking-widest mb-2">
          {COMPETITION_LABEL[fixture.competition] ?? fixture.competition}
          {fixture.round ? ` · ${fixture.round}` : ''}
        </div>
        <div className="flex items-center justify-between gap-4 mb-1">
          <h1 className="text-xl font-semibold text-[#F2F2F2]">{fixture.homeTeam.name}</h1>
          <span className="text-sm font-mono text-[#404040]">vs</span>
          <h1 className="text-xl font-semibold text-[#F2F2F2] text-right">{fixture.awayTeam.name}</h1>
        </div>
        <p className="text-xs font-mono text-[#787878]">{formatKickoff(fixture.kickoff)}</p>
        {fixture.venue && (
          <p className="text-xs font-mono text-[#404040] mt-0.5">{fixture.venue}</p>
        )}
      </div>

      {/* Data status warnings */}
      {oddsUnavailable && (
        <div className="mb-4">
          <DataUnavailable message="Cuotas no disponibles. El análisis se mostrará cuando el mercado abra." />
        </div>
      )}
      {statsInsufficient && !oddsUnavailable && (
        <div className="mb-4">
          <DataUnavailable message="Pocos partidos jugados. Confianza reducida." />
        </div>
      )}

      {/* Analysis */}
      {analysis.markets.length > 0 ? (
        <div className="space-y-8">
          <div>
            <div className="text-[10px] font-mono text-[#404040] uppercase tracking-widest mb-4">
              Análisis de mercados · {analysis.modelVersion}
            </div>
            <MarketBreakdown markets={analysis.markets} fixtureId={id} />
          </div>

          {/* Trace panels */}
          <div>
            <div className="text-[10px] font-mono text-[#404040] uppercase tracking-widest mb-3">
              Trazabilidad del modelo
            </div>
            <div className="space-y-2">
              {analysis.markets.flatMap((m) =>
                m.picks
                  .filter((p) => p.label !== 'AVOID')
                  .slice(0, 1)
                  .map((p) => (
                    <TracePanel key={`${m.market}-${p.selection}`} trace={p.trace} selection={`${p.selection} (${m.market})`} />
                  ))
              )}
            </div>
          </div>
        </div>
      ) : (
        <DataUnavailable message="No hay suficientes datos para generar un análisis." />
      )}

      {/* Footer */}
      <footer className="mt-12 pt-4 border-t border-[#1E1E1E]">
        <p className="text-[10px] font-mono text-[#404040] leading-relaxed">
          Línea Oculta es una herramienta de análisis estadístico. No garantiza resultados.
          Las probabilidades son estimaciones basadas en datos históricos. Juega responsablemente.
        </p>
      </footer>
    </main>
  );
}
