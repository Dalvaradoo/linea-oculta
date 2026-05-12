import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getFixturesForAllCompetitions, getFixtures } from '@/services/fixtures';
import { getOdds } from '@/services/odds';
import { getTeamStats } from '@/services/team-stats';
import { runAnalysis } from '@/lib/analysis/run';
import { MarketBreakdown } from '@/components/analysis/MarketBreakdown';
import { TracePanel } from '@/components/analysis/TracePanel';
import { PickHero } from '@/components/analysis/PickHero';
import { DataUnavailable } from '@/components/ui/DataUnavailable';
import { ShareButton } from '@/components/ui/ShareButton';
import { NormalizedFixture } from '@/lib/contracts/fixture';

type Params = { params: Promise<{ id: string }> };

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL
  ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const fixtures = await getFixturesForAllCompetitions();
  const fixture = fixtures.find((f) => f.id === id);
  if (!fixture) return {};

  const title = `${fixture.homeTeam.name} vs ${fixture.awayTeam.name} · Línea Oculta`;
  const ogImage = `${BASE_URL}/api/og/${id}`;

  return {
    title,
    openGraph: {
      title,
      images: [{ url: ogImage, width: 1080, height: 1080 }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      images: [ogImage],
    },
  };
}

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

function OtherMatchRow({ fixture }: { fixture: NormalizedFixture }) {
  return (
    <Link
      href={`/match/${fixture.id}`}
      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#141414] transition-colors duration-150 group"
    >
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        {fixture.homeTeam.logo && (
          <Image src={fixture.homeTeam.logo} alt={fixture.homeTeam.name} width={16} height={16} className="object-contain flex-shrink-0" />
        )}
        <span className="text-xs text-[#787878] group-hover:text-[#C0C0C0] transition-colors truncate">
          {fixture.homeTeam.name}
        </span>
      </div>
      <span className="text-[17px] font-mono text-[#404040] flex-shrink-0">vs</span>
      <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
        <span className="text-xs text-[#787878] group-hover:text-[#C0C0C0] transition-colors truncate text-right">
          {fixture.awayTeam.name}
        </span>
        {fixture.awayTeam.logo && (
          <Image src={fixture.awayTeam.logo} alt={fixture.awayTeam.name} width={16} height={16} className="object-contain flex-shrink-0" />
        )}
      </div>
    </Link>
  );
}

export default async function MatchPage({ params }: Params) {
  const { id } = await params;

  const fixtures = await getFixturesForAllCompetitions();
  const fixture = fixtures.find((f) => f.id === id);
  if (!fixture) notFound();

  const [odds, homeStats, awayStats, competitionFixtures] = await Promise.all([
    getOdds(fixture),
    getTeamStats(fixture.homeTeam.id, fixture.competition),
    getTeamStats(fixture.awayTeam.id, fixture.competition),
    getFixtures(fixture.competition),
  ]);

  const analysis = runAnalysis(fixture, odds, homeStats, awayStats);
  const otherFixtures = competitionFixtures.filter((f) => f.id !== id).slice(0, 6);

  const oddsUnavailable = analysis.dataAvailability.odds === 'NOT_AVAILABLE';
  const statsInsufficient =
    analysis.dataAvailability.homeStats === 'INSUFFICIENT' ||
    analysis.dataAvailability.awayStats === 'INSUFFICIENT';

  return (
    <div className="px-4 py-5 md:px-6 md:py-6">
      {/* Match meta */}
      <div className="mb-6">
        <div className="flex items-center justify-between gap-4 mb-1.5">
          <div className="text-[11px] font-mono text-[#9A9E9A] uppercase tracking-widest">
            {COMPETITION_LABEL[fixture.competition] ?? fixture.competition}
            {fixture.round ? ` · ${fixture.round}` : ''}
          </div>
          <ShareButton
            fixtureId={id}
            matchTitle={`${fixture.homeTeam.name} vs ${fixture.awayTeam.name}`}
          />
        </div>
        <p className="text-[17px] font-mono text-[#6B6F6B]">{formatKickoff(fixture.kickoff)}</p>
        {fixture.venue && (
          <p className="text-[18px] font-mono text-[#6B6F6B] mt-0.5">{fixture.venue}</p>
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
          {/* Hero pick */}
          <PickHero fixture={fixture} analysis={analysis} />

          <div>
            <div className="text-[11px] font-mono text-[#9A9E9A] uppercase tracking-widest mb-5">
              Todos los mercados · {analysis.modelVersion}
            </div>
            <MarketBreakdown markets={analysis.markets} />
          </div>

          {/* Trace panels */}
          <div>
            <div className="text-[11px] font-mono text-[#6B6F6B] uppercase tracking-widest mb-3">
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

      {/* Other matches in same competition */}
      {otherFixtures.length > 0 && (
        <div className="mt-10">
          <div className="text-[11px] font-mono text-[#6B6F6B] uppercase tracking-widest mb-2">
            Otros partidos · {COMPETITION_LABEL[fixture.competition] ?? fixture.competition}
          </div>
          <div className="space-y-0.5">
            {otherFixtures.map((f) => (
              <OtherMatchRow key={f.id} fixture={f} />
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-10 pt-4 border-t border-[#1E1E1E]">
        <p className="text-[18px] font-mono text-[#6B6F6B] leading-relaxed">
          Línea Oculta es una herramienta de análisis estadístico. No garantiza resultados.
          Las probabilidades son estimaciones basadas en datos históricos. Juega responsablemente.
        </p>
      </footer>
    </div>
  );
}
