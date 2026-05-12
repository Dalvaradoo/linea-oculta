import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

type Params = { params: Promise<{ fixtureId: string }> };

const MARKET_LABEL: Record<string, string> = {
  MATCH_WINNER:  'Match Winner',
  BTTS:          'Ambos Anotan',
  OVER_UNDER_25: 'Total Goles',
};

interface Bar { selection: string; modelPct: number; marketPct: number; edgePct: number }

function edgeColor(e: number) {
  return e > 5 ? '#00E062' : e > 2 ? '#F5A623' : e < -2 ? '#E53935' : '#6B6F6B';
}

const S = 1080;

export async function GET(req: NextRequest, { params }: Params) {
  try {
    await params; // consume but don't need fixtureId
    const p = req.nextUrl.searchParams;

    const home  = p.get('home')  ?? '';
    const away  = p.get('away')  ?? '';
    const comp  = p.get('competition') ?? '';
    const kick  = p.get('kickoff') ?? '';
    const label = p.get('label') ?? '';
    const mkt   = p.get('market') ?? '';
    const pick  = p.get('pick') ?? '';
    const odds  = p.get('odds') ?? '';
    const edge  = parseFloat(p.get('edge') ?? '0');
    const mdl   = parseFloat(p.get('modelPct') ?? '0');
    const fair  = parseFloat(p.get('fairPct') ?? '0');
    // Don't use external logo images — satori fetch fails in production
    // Use team name initials instead
    const homeInitials = home.split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase();
    const awayInitials = away.split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase();

    let bars: Bar[] = [];
    try { bars = JSON.parse(p.get('bars') ?? '[]'); } catch { bars = []; }

    const isValue = label === 'VALUE';
    const accent  = isValue ? '#00E062' : label === 'LEAN' ? '#F5A623' : '#9A9E9A';

    return new ImageResponse(
      (
        <div style={{ width: S, height: S, display: 'flex', flexDirection: 'column', background: '#07090F', fontFamily: 'monospace', overflow: 'hidden' }}>

          {/* Aurora */}
          <div style={{ position: 'absolute', top: -180, left: -180, width: 700, height: 700, borderRadius: '50%', background: `radial-gradient(circle, ${accent}18 0%, transparent 65%)` }} />

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '40px 52px 0' }}>
            <span style={{ color: accent, fontSize: 20, fontWeight: 800, letterSpacing: 3 }}>LÍNEA OCULTA</span>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
              <span style={{ color: '#9A9E9A', fontSize: 13 }}>{comp.toUpperCase()}</span>
              <span style={{ color: '#6B6F6B', fontSize: 12 }}>{kick}</span>
            </div>
          </div>

          {/* Teams */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 52px 0', gap: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, flex: 1 }}>
              <div style={{ width: 90, height: 90, borderRadius: '50%', background: '#1E201E', border: `2px solid ${accent}33`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: accent, fontSize: 22, fontWeight: 800 }}>{homeInitials}</span>
              </div>
              <span style={{ color: '#F0F2F0', fontSize: 26, fontWeight: 700, textAlign: 'center' }}>{home}</span>
            </div>
            <span style={{ color: '#2A2E2A', fontSize: 22, padding: '0 20px' }}>VS</span>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, flex: 1 }}>
              <div style={{ width: 90, height: 90, borderRadius: '50%', background: '#1E201E', border: `2px solid ${accent}33`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: accent, fontSize: 22, fontWeight: 800 }}>{awayInitials}</span>
              </div>
              <span style={{ color: '#F0F2F0', fontSize: 26, fontWeight: 700, textAlign: 'center' }}>{away}</span>
            </div>
          </div>

          {/* Divider */}
          <div style={{ margin: '28px 52px 0', height: 1, background: '#1E201E' }} />

          {/* Pick */}
          {pick && (
            <div style={{ margin: '24px 52px 0', padding: '24px 32px', borderRadius: 20, background: isValue ? '#0D1A12' : '#1A1610', border: `1px solid ${accent}44`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ padding: '4px 12px', borderRadius: 6, background: `${accent}22`, border: `1px solid ${accent}55`, color: accent, fontSize: 13, fontWeight: 800 }}>{label}</div>
                  <span style={{ color: '#9A9E9A', fontSize: 12 }}>{(MARKET_LABEL[mkt] ?? mkt).toUpperCase()}</span>
                </div>
                <span style={{ color: '#F0F2F0', fontSize: 30, fontWeight: 700 }}>{pick}</span>
                <span style={{ color: '#6B6F6B', fontSize: 12 }}>modelo {mdl.toFixed(1)}% · mercado {fair.toFixed(1)}%</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                <span style={{ color: accent, fontSize: 72, fontWeight: 900, lineHeight: '1' }}>{odds}</span>
                <span style={{ color: accent, fontSize: 20, fontWeight: 700 }}>{edge > 0 ? '+' : ''}{edge.toFixed(1)}% edge</span>
              </div>
            </div>
          )}

          {/* Bars */}
          {bars.length > 0 && (
            <div style={{ margin: '20px 52px 0', display: 'flex', flexDirection: 'column' }}>
              <span style={{ color: '#6B6F6B', fontSize: 11, letterSpacing: 2, marginBottom: 12 }}>
                MODELO VS MERCADO · {(MARKET_LABEL[mkt] ?? mkt).toUpperCase()}
              </span>
              {bars.map((b, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: '#C8CCC8', fontSize: 13, fontWeight: 600 }}>{b.selection}</span>
                    <span style={{ color: edgeColor(b.edgePct), fontSize: 13, fontWeight: 700 }}>{b.edgePct > 0 ? '+' : ''}{b.edgePct.toFixed(1)}%</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span style={{ color: '#6B6F6B', fontSize: 10, width: 26 }}>MOD</span>
                    <div style={{ width: 700, height: 7, background: '#1E201E', borderRadius: 3, position: 'relative' }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, width: `${Math.round(b.modelPct * 7)}px`, height: 7, background: edgeColor(b.edgePct), borderRadius: 3 }} />
                    </div>
                    <span style={{ color: '#C8CCC8', fontSize: 11, width: 32 }}>{Math.round(b.modelPct)}%</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: '#6B6F6B', fontSize: 10, width: 26 }}>MKT</span>
                    <div style={{ width: 700, height: 7, background: '#1E201E', borderRadius: 3, position: 'relative' }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, width: `${Math.round(b.marketPct * 7)}px`, height: 7, background: '#3A3E3A', borderRadius: 3 }} />
                    </div>
                    <span style={{ color: '#6B6F6B', fontSize: 11, width: 32 }}>{Math.round(b.marketPct)}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 52px', marginTop: 24 }}>
            <span style={{ color: '#3A3E3A', fontSize: 11 }}>linea-oculta-v4.vercel.app</span>
            <span style={{ color: '#3A3E3A', fontSize: 11 }}>Análisis estadístico · Sin garantías</span>
          </div>

        </div>
      ),
      { width: S, height: S }
    );
  } catch (err) {
    console.error('[og] error:', err);
    return new Response(`OG error: ${String(err)}`, { status: 500 });
  }
}
