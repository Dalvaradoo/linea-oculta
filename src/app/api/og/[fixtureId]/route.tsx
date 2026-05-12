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
          position: 'absolute', top: -200, left: -200,
          width: 800, height: 800, borderRadius: '50%',
          background: `radial-gradient(circle, ${accent}1A 0%, transparent 65%)`,
        }} />
        <div style={{
          position: 'absolute', bottom: -200, right: -200,
          width: 700, height: 700, borderRadius: '50%',
          background: 'radial-gradient(circle, #0033AA14 0%, transparent 65%)',
        }} />

        {/* ── TOP BAR ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '44px 56px 0',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <ellipse cx="12" cy="6" rx="8" ry="3" stroke={accent} strokeWidth="1.5" fill="none" />
              <line x1="4" y1="6" x2="4" y2="18" stroke={accent} strokeWidth="1.5" />
              <line x1="20" y1="6" x2="20" y2="18" stroke={accent} strokeWidth="1.5" />
              <line x1="4" y1="12" x2="20" y2="12" stroke={accent} strokeWidth="0.8" strokeDasharray="2 2" />
              <ellipse cx="12" cy="18" rx="8" ry="3" stroke={accent} strokeWidth="1.5" fill="none" />
            </svg>
            <span style={{ color: accent, fontSize: 22, fontWeight: 800, letterSpacing: 3 }}>
              LÍNEA OCULTA
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            <span style={{ color: '#9A9E9A', fontSize: 15, letterSpacing: 1 }}>
              {(COMPETITION_LABEL[fixture.competition] ?? fixture.competition).toUpperCase()}
            </span>
            <span style={{ color: '#6B6F6B', fontSize: 13 }}>
              {formatDate(fixture.kickoff)}
            </span>
          </div>
        </div>

        {/* ── TEAMS ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '52px 56px 0', gap: 0,
        }}>
          {/* Home */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, flex: 1 }}>
            {fixture.homeTeam.logo ? (
              <img src={fixture.homeTeam.logo} width={110} height={110}
                style={{ objectFit: 'contain', borderRadius: '50%', background: '#1E201E' }} />
            ) : (
              <div style={{ width: 110, height: 110, borderRadius: '50%', background: '#1E201E' }} />
            )}
            <span style={{
              color: '#F0F2F0', fontSize: 30, fontWeight: 700,
              textAlign: 'center', lineHeight: 1.2,
            }}>
              {fixture.homeTeam.name}
            </span>
          </div>

          {/* VS */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 24px' }}>
            <span style={{ color: '#2A2E2A', fontSize: 28, fontWeight: 700 }}>VS</span>
          </div>

          {/* Away */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, flex: 1 }}>
            {fixture.awayTeam.logo ? (
              <img src={fixture.awayTeam.logo} width={110} height={110}
                style={{ objectFit: 'contain', borderRadius: '50%', background: '#1E201E' }} />
            ) : (
              <div style={{ width: 110, height: 110, borderRadius: '50%', background: '#1E201E' }} />
            )}
            <span style={{
              color: '#F0F2F0', fontSize: 30, fontWeight: 700,
              textAlign: 'center', lineHeight: 1.2,
            }}>
              {fixture.awayTeam.name}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div style={{
          margin: '44px 56px 0',
          height: 1,
          background: `linear-gradient(to right, transparent, ${accent}44, transparent)`,
        }} />

        {/* ── PICK CARD ── */}
        {best ? (
          <div style={{
            margin: '36px 56px 0',
            padding: '36px 44px',
            borderRadius: 24,
            background: isValue ? '#0D1A12CC' : '#1A1610CC',
            border: `1px solid ${accent}44`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 24,
          }}>
            {/* Left */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Label + market */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  padding: '6px 18px', borderRadius: 8,
                  background: `${accent}22`, border: `1px solid ${accent}55`,
                  color: accent, fontSize: 16, fontWeight: 800, letterSpacing: 1.5,
                }}>
                  {best.pick.label}
                </div>
                <span style={{ color: '#9A9E9A', fontSize: 15, letterSpacing: 1 }}>
                  {(MARKET_LABEL[best.market] ?? best.market).toUpperCase()}
                </span>
              </div>
              {/* Selection */}
              <span style={{ color: '#F0F2F0', fontSize: 38, fontWeight: 700, lineHeight: 1.1 }}>
                {best.pick.selection}
              </span>
              {/* Model vs market */}
              <span style={{ color: '#6B6F6B', fontSize: 15 }}>
                modelo {(best.pick.modelProbability * 100).toFixed(1)}% · mercado {(best.pick.fairProbability * 100).toFixed(1)}%
              </span>
            </div>

            {/* Right: odds + edge */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
              <span style={{ color: accent, fontSize: 96, fontWeight: 900, lineHeight: 1, letterSpacing: -2 }}>
                {best.pick.oddsAmerican}
              </span>
              <span style={{ color: accent, fontSize: 26, fontWeight: 700 }}>
                {best.pick.edgePct > 0 ? '+' : ''}{best.pick.edgePct.toFixed(1)}% edge
              </span>
            </div>
          </div>
        ) : (
          <div style={{
            margin: '36px 56px 0', padding: '48px',
            borderRadius: 24, border: '1px solid #2A2E2A',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: '#6B6F6B', fontSize: 22 }}>Sin valor detectado en este partido</span>
          </div>
        )}

        {/* ── FOOTER ── */}
        <div style={{
          marginTop: 'auto',
          padding: '0 56px 40px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ color: '#3A3E3A', fontSize: 13 }}>linea-oculta-v4.vercel.app</span>
          <span style={{ color: '#3A3E3A', fontSize: 13 }}>Análisis estadístico · Sin garantías</span>
        </div>
      </div>
    ),
    { width: SIZE, height: SIZE }
  );
}
