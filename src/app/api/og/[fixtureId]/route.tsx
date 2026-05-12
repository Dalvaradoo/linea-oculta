import { ImageResponse } from 'next/og';
import { getFixturesForAllCompetitions } from '@/services/fixtures';
import { getOdds } from '@/services/odds';
import { getTeamStats } from '@/services/team-stats';
import { runAnalysis } from '@/lib/analysis/run';
import { Label } from '@/lib/contracts/pick';

export const runtime = 'nodejs';

type Params = { params: Promise<{ fixtureId: string }> };

const COMPETITION_LABEL: Record<string, string> = {
  LIGA_MX: 'Liga MX',
  WC_2026: 'Copa del Mundo 2026',
};

const MARKET_LABEL: Record<string, string> = {
  MATCH_WINNER: 'Match Winner',
  BTTS:         'Ambos Anotan',
  OVER_UNDER_25:'Total Goles',
};

function getBestPick(analysis: ReturnType<typeof runAnalysis>) {
  for (const target of ['VALUE', 'LEAN'] as Label[]) {
    for (const market of analysis.markets) {
      for (const pick of market.picks) {
        if (pick.label === target) return { pick, market: market.market };
      }
    }
  }
  return null;
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('es-MX', {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
  });
}

const SIZE = 1080;

export async function GET(_req: Request, { params }: Params) {
  const { fixtureId } = await params;

  const fixtures = await getFixturesForAllCompetitions();
  const fixture  = fixtures.find((f) => f.id === fixtureId);
  if (!fixture) return new Response('Not found', { status: 404 });

  const [odds, homeStats, awayStats] = await Promise.all([
    getOdds(fixture),
    getTeamStats(fixture.homeTeam.id, fixture.competition),
    getTeamStats(fixture.awayTeam.id, fixture.competition),
  ]);

  const analysis = runAnalysis(fixture, odds, homeStats, awayStats);
  const best = getBestPick(analysis);
  const isValue = best?.pick.label === 'VALUE';
  const accent  = isValue ? '#00E062' : best ? '#F5A623' : '#9A9E9A';

  // Pick the most relevant market for the bars section
  const barMarket = analysis.markets.find(m => m.market === best?.market)
    ?? analysis.markets[0];

  function edgeColor(e: number) {
    return e > 5 ? '#00E062' : e > 2 ? '#F5A623' : e < -2 ? '#E53935' : '#6B6F6B';
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: SIZE, height: SIZE,
          display: 'flex', flexDirection: 'column',
          background: '#07090F',
          fontFamily: 'monospace',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Aurora blobs */}
        <div style={{
          position: 'absolute', top: -180, left: -180,
          width: 700, height: 700, borderRadius: '50%',
          background: `radial-gradient(circle, ${accent}18 0%, transparent 65%)`,
        }} />
        <div style={{
          position: 'absolute', bottom: -150, right: -150,
          width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, #0033AA12 0%, transparent 65%)',
        }} />

        {/* TOP BAR */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '40px 52px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <ellipse cx="12" cy="6" rx="8" ry="3" stroke={accent} strokeWidth="1.5" fill="none" />
              <line x1="4" y1="6" x2="4" y2="18" stroke={accent} strokeWidth="1.5" />
              <line x1="20" y1="6" x2="20" y2="18" stroke={accent} strokeWidth="1.5" />
              <line x1="4" y1="12" x2="20" y2="12" stroke={accent} strokeWidth="0.8" strokeDasharray="2 2" />
              <ellipse cx="12" cy="18" rx="8" ry="3" stroke={accent} strokeWidth="1.5" fill="none" />
            </svg>
            <span style={{ color: accent, fontSize: 20, fontWeight: 800, letterSpacing: 3 }}>LÍNEA OCULTA</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
            <span style={{ color: '#9A9E9A', fontSize: 14, letterSpacing: 1 }}>
              {(COMPETITION_LABEL[fixture.competition] ?? fixture.competition).toUpperCase()}
            </span>
            <span style={{ color: '#6B6F6B', fontSize: 12 }}>{formatDate(fixture.kickoff)}</span>
          </div>
        </div>

        {/* TEAMS */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 52px 0', gap: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, flex: 1 }}>
            {fixture.homeTeam.logo
              ? <img src={fixture.homeTeam.logo} width={96} height={96} style={{ objectFit: 'contain', borderRadius: '50%', background: '#1E201E' }} />
              : <div style={{ width: 96, height: 96, borderRadius: '50%', background: '#1E201E' }} />
            }
            <span style={{ color: '#F0F2F0', fontSize: 26, fontWeight: 700, textAlign: 'center', lineHeight: 1.2 }}>
              {fixture.homeTeam.name}
            </span>
          </div>
          <span style={{ color: '#2A2E2A', fontSize: 24, fontWeight: 700, padding: '0 20px' }}>VS</span>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, flex: 1 }}>
            {fixture.awayTeam.logo
              ? <img src={fixture.awayTeam.logo} width={96} height={96} style={{ objectFit: 'contain', borderRadius: '50%', background: '#1E201E' }} />
              : <div style={{ width: 96, height: 96, borderRadius: '50%', background: '#1E201E' }} />
            }
            <span style={{ color: '#F0F2F0', fontSize: 26, fontWeight: 700, textAlign: 'center', lineHeight: 1.2 }}>
              {fixture.awayTeam.name}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div style={{ margin: '32px 52px 0', height: 1, background: `linear-gradient(to right, transparent, ${accent}44, transparent)` }} />

        {/* PICK */}
        {best ? (
          <div style={{
            margin: '28px 52px 0', padding: '28px 36px',
            borderRadius: 20,
            background: isValue ? '#0D1A12CC' : '#1A1610CC',
            border: `1px solid ${accent}44`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20,
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  padding: '5px 14px', borderRadius: 7,
                  background: `${accent}22`, border: `1px solid ${accent}55`,
                  color: accent, fontSize: 14, fontWeight: 800, letterSpacing: 1.5,
                }}>
                  {best.pick.label}
                </div>
                <span style={{ color: '#9A9E9A', fontSize: 13, letterSpacing: 1 }}>
                  {(MARKET_LABEL[best.market] ?? best.market).toUpperCase()}
                </span>
              </div>
              <span style={{ color: '#F0F2F0', fontSize: 32, fontWeight: 700, lineHeight: 1.1 }}>
                {best.pick.selection}
              </span>
              <span style={{ color: '#6B6F6B', fontSize: 13 }}>
                modelo {(best.pick.modelProbability * 100).toFixed(1)}% · mercado {(best.pick.fairProbability * 100).toFixed(1)}%
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
              <span style={{ color: accent, fontSize: 80, fontWeight: 900, lineHeight: 1, letterSpacing: -2 }}>
                {best.pick.oddsAmerican}
              </span>
              <span style={{ color: accent, fontSize: 22, fontWeight: 700 }}>
                {best.pick.edgePct > 0 ? '+' : ''}{best.pick.edgePct.toFixed(1)}% edge
              </span>
            </div>
          </div>
        ) : null}

        {/* MODELO VS MERCADO */}
        {barMarket && barMarket.picks.length > 0 && (
          <div style={{ margin: '24px 52px 0', display: 'flex', flexDirection: 'column', gap: 0 }}>
            <span style={{ color: '#6B6F6B', fontSize: 11, letterSpacing: 2, marginBottom: 16 }}>
              MODELO VS MERCADO · {(MARKET_LABEL[barMarket.market] ?? barMarket.market).toUpperCase()}
            </span>
            {barMarket.picks.map((pick) => {
              const modelPct  = Math.round(pick.modelProbability  * 100);
              const marketPct = Math.round(pick.fairProbability * 100);
              const eColor = edgeColor(pick.edgePct);
              return (
                <div key={pick.selection} style={{ display: 'flex', flexDirection: 'column', marginBottom: 16 }}>
                  {/* Label row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ color: '#C8CCC8', fontSize: 14, fontWeight: 600 }}>{pick.selection}</span>
                    <span style={{ color: eColor, fontSize: 14, fontWeight: 700 }}>
                      {pick.edgePct > 0 ? '+' : ''}{pick.edgePct.toFixed(1)}%
                    </span>
                  </div>
                  {/* Model bar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <span style={{ color: '#6B6F6B', fontSize: 11, width: 28, textAlign: 'right' }}>MOD</span>
                    <div style={{ flex: 1, height: 8, background: '#1E201E', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${modelPct}%`, height: '100%', background: eColor, borderRadius: 4 }} />
                    </div>
                    <span style={{ color: '#C8CCC8', fontSize: 12, width: 34 }}>{modelPct}%</span>
                  </div>
                  {/* Market bar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ color: '#6B6F6B', fontSize: 11, width: 28, textAlign: 'right' }}>MKT</span>
                    <div style={{ flex: 1, height: 8, background: '#1E201E', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${marketPct}%`, height: '100%', background: '#3A3E3A', borderRadius: 4 }} />
                    </div>
                    <span style={{ color: '#6B6F6B', fontSize: 12, width: 34 }}>{marketPct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* FOOTER */}
        <div style={{ marginTop: 'auto', padding: '0 52px 36px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#3A3E3A', fontSize: 12 }}>linea-oculta-v4.vercel.app</span>
          <span style={{ color: '#3A3E3A', fontSize: 12 }}>Análisis estadístico · Sin garantías</span>
        </div>
      </div>
    ),
    { width: SIZE, height: SIZE }
  );
}
