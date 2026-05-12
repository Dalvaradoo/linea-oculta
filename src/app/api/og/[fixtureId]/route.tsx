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

const MARKET_LABEL: Record<string, string> = {
  MATCH_WINNER: 'Match Winner',
  BTTS: 'Ambos Anotan',
  OVER_UNDER_25: 'Total Goles',
};

export async function GET(_req: Request, { params }: Params) {
  const { fixtureId } = await params;

  const fixtures = await getFixturesForAllCompetitions();
  const fixture = fixtures.find((f) => f.id === fixtureId);

  if (!fixture) {
    return new Response('Not found', { status: 404 });
  }

  const [odds, homeStats, awayStats] = await Promise.all([
    getOdds(fixture),
    getTeamStats(fixture.homeTeam.id, fixture.competition),
    getTeamStats(fixture.awayTeam.id, fixture.competition),
  ]);

  const analysis = runAnalysis(fixture, odds, homeStats, awayStats);
  const best = getBestPick(analysis);
  const isValue = best?.pick.label === 'VALUE';

  const accentColor = isValue ? '#00E062' : best ? '#F5A623' : '#787878';
  const competition = COMPETITION_LABEL[fixture.competition] ?? fixture.competition;

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: 'flex',
          flexDirection: 'column',
          background: '#07090F',
          fontFamily: 'monospace',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Aurora background blobs */}
        <div style={{
          position: 'absolute', top: -100, left: -100,
          width: 700, height: 700,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${accentColor}22 0%, transparent 70%)`,
        }} />
        <div style={{
          position: 'absolute', bottom: -150, right: -100,
          width: 600, height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, #0040C022 0%, transparent 70%)',
        }} />

        {/* Top bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '28px 48px 0',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <ellipse cx="12" cy="6" rx="8" ry="3" stroke={accentColor} strokeWidth="1.5" fill="none" />
              <line x1="4" y1="6" x2="4" y2="18" stroke={accentColor} strokeWidth="1.5" />
              <line x1="20" y1="6" x2="20" y2="18" stroke={accentColor} strokeWidth="1.5" />
              <line x1="4" y1="12" x2="20" y2="12" stroke={accentColor} strokeWidth="0.8" strokeDasharray="2 2" />
              <ellipse cx="12" cy="18" rx="8" ry="3" stroke={accentColor} strokeWidth="1.5" fill="none" />
            </svg>
            <span style={{ color: accentColor, fontSize: 18, fontWeight: 700, letterSpacing: 2 }}>
              LÍNEA OCULTA
            </span>
          </div>
          <span style={{ color: '#6B6F6B', fontSize: 14, letterSpacing: 1 }}>
            {competition.toUpperCase()}
          </span>
        </div>

        {/* Teams */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 32, padding: '36px 48px 0', flex: 1,
        }}>
          {/* Home */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, flex: 1 }}>
            {fixture.homeTeam.logo ? (
              <img
                src={fixture.homeTeam.logo}
                width={80} height={80}
                style={{ objectFit: 'contain', borderRadius: '50%', background: '#1E201E' }}
              />
            ) : (
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#1E201E' }} />
            )}
            <span style={{ color: '#F0F2F0', fontSize: 26, fontWeight: 700, textAlign: 'center' }}>
              {fixture.homeTeam.name}
            </span>
          </div>

          {/* VS */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#3A3E3A', fontSize: 20 }}>vs</span>
          </div>

          {/* Away */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, flex: 1 }}>
            {fixture.awayTeam.logo ? (
              <img
                src={fixture.awayTeam.logo}
                width={80} height={80}
                style={{ objectFit: 'contain', borderRadius: '50%', background: '#1E201E' }}
              />
            ) : (
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#1E201E' }} />
            )}
            <span style={{ color: '#F0F2F0', fontSize: 26, fontWeight: 700, textAlign: 'center' }}>
              {fixture.awayTeam.name}
            </span>
          </div>
        </div>

        {/* Pick card */}
        {best ? (
          <div style={{
            margin: '24px 48px 32px',
            padding: '24px 36px',
            borderRadius: 20,
            background: isValue ? '#0D1A1200' : '#1A161000',
            border: `1px solid ${accentColor}33`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backdropFilter: 'blur(8px)',
            backgroundColor: isValue ? '#0D1A12CC' : '#1A1610CC',
          }}>
            {/* Left: label + selection */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  padding: '4px 12px',
                  borderRadius: 6,
                  background: `${accentColor}22`,
                  border: `1px solid ${accentColor}55`,
                  color: accentColor,
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: 1,
                }}>
                  {best.pick.label}
                </div>
                <span style={{ color: '#9A9E9A', fontSize: 13, letterSpacing: 1 }}>
                  {(MARKET_LABEL[best.market] ?? best.market).toUpperCase()}
                </span>
              </div>
              <span style={{ color: '#F0F2F0', fontSize: 32, fontWeight: 700 }}>
                {best.pick.selection}
              </span>
              <span style={{ color: '#6B6F6B', fontSize: 13 }}>
                modelo {(best.pick.modelProbability * 100).toFixed(1)}% · mercado {(best.pick.fairProbability * 100).toFixed(1)}%
              </span>
            </div>

            {/* Right: odds + edge */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
              <span style={{ color: accentColor, fontSize: 72, fontWeight: 900, lineHeight: 1 }}>
                {best.pick.oddsAmerican}
              </span>
              <span style={{
                color: accentColor,
                fontSize: 22,
                fontWeight: 700,
              }}>
                {best.pick.edgePct > 0 ? '+' : ''}{best.pick.edgePct.toFixed(1)}% edge
              </span>
            </div>
          </div>
        ) : (
          <div style={{
            margin: '24px 48px 32px', padding: '24px 36px',
            borderRadius: 20, border: '1px solid #2A2E2A',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: '#6B6F6B', fontSize: 18 }}>Sin valor detectado en este partido</span>
          </div>
        )}

        {/* Bottom: disclaimer */}
        <div style={{
          padding: '0 48px 24px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ color: '#3A3E3A', fontSize: 11 }}>
            linea-oculta-v4.vercel.app
          </span>
          <span style={{ color: '#3A3E3A', fontSize: 11 }}>
            Análisis estadístico · Sin garantías · Juega responsablemente
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
