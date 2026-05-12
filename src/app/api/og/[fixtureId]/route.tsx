import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

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

// Load logo once (cached by Node module system)
function getLogoDataUrl(): string {
  try {
    const buf = readFileSync(join(process.cwd(), 'public', 'og-logo.png'));
    return `data:image/png;base64,${buf.toString('base64')}`;
  } catch {
    return '';
  }
}

const S = 1080;

export async function GET(req: NextRequest, { params }: Params) {
  try {
    await params;
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

    let bars: Bar[] = [];
    try { bars = JSON.parse(p.get('bars') ?? '[]'); } catch { bars = []; }

    const isValue = label === 'VALUE';
    const accent  = isValue ? '#00E062' : label === 'LEAN' ? '#F5A623' : '#9A9E9A';
    const logoSrc = getLogoDataUrl();

    const homeInitials = home.split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase();
    const awayInitials = away.split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase();

    // Bar width: container is 640px → 1% = 6.4px
    const barW = 640;
    const barH = 10;

    return new ImageResponse(
      (
        <div style={{
          width: S, height: S,
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          background: '#07090F', fontFamily: 'monospace',
          padding: '52px 60px',
          overflow: 'hidden',
        }}>
          {/* Aurora blob */}
          <div style={{
            position: 'absolute', top: -200, left: -200,
            width: 800, height: 800, borderRadius: '50%',
            background: `radial-gradient(circle, ${accent}16 0%, transparent 60%)`,
          }} />

          {/* ── HEADER ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {logoSrc && (
                <img src={logoSrc} width={64} height={64} style={{ objectFit: 'contain' }} />
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ color: accent, fontSize: 22, fontWeight: 900, letterSpacing: 4 }}>LÍNEA OCULTA</span>
                <span style={{ color: '#6B6F6B', fontSize: 13, letterSpacing: 1 }}>análisis deportivo</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
              <span style={{ color: '#9A9E9A', fontSize: 15, letterSpacing: 1 }}>{comp.toUpperCase()}</span>
              <span style={{ color: '#6B6F6B', fontSize: 13 }}>{kick}</span>
            </div>
          </div>

          {/* ── TEAMS ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, flex: 1 }}>
              <div style={{
                width: 110, height: 110, borderRadius: '50%',
                background: '#1E201E', border: `2px solid ${accent}33`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ color: accent, fontSize: 28, fontWeight: 900 }}>{homeInitials}</span>
              </div>
              <span style={{ color: '#F0F2F0', fontSize: 28, fontWeight: 700, textAlign: 'center', lineHeight: 1.2 }}>{home}</span>
            </div>
            <span style={{ color: '#2A2E2A', fontSize: 26, fontWeight: 700, padding: '0 28px' }}>VS</span>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, flex: 1 }}>
              <div style={{
                width: 110, height: 110, borderRadius: '50%',
                background: '#1E201E', border: `2px solid ${accent}33`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ color: accent, fontSize: 28, fontWeight: 900 }}>{awayInitials}</span>
              </div>
              <span style={{ color: '#F0F2F0', fontSize: 28, fontWeight: 700, textAlign: 'center', lineHeight: 1.2 }}>{away}</span>
            </div>
          </div>

          {/* ── PICK ── */}
          {pick ? (
            <div style={{
              padding: '32px 40px',
              borderRadius: 24,
              background: isValue ? '#0D1A12' : '#1A1610',
              border: `1px solid ${accent}44`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24,
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    padding: '6px 16px', borderRadius: 8,
                    background: `${accent}22`, border: `1px solid ${accent}55`,
                    color: accent, fontSize: 15, fontWeight: 900, letterSpacing: 2,
                  }}>{label}</div>
                  <span style={{ color: '#9A9E9A', fontSize: 14, letterSpacing: 1 }}>
                    {(MARKET_LABEL[mkt] ?? mkt).toUpperCase()}
                  </span>
                </div>
                <span style={{ color: '#F0F2F0', fontSize: 34, fontWeight: 700, lineHeight: 1.1 }}>{pick}</span>
                <span style={{ color: '#6B6F6B', fontSize: 14 }}>
                  modelo {mdl.toFixed(1)}% · mercado {fair.toFixed(1)}%
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                <span style={{ color: accent, fontSize: 88, fontWeight: 900, lineHeight: 1, letterSpacing: -3 }}>{odds}</span>
                <span style={{ color: accent, fontSize: 24, fontWeight: 700 }}>
                  {edge > 0 ? '+' : ''}{edge.toFixed(1)}% edge
                </span>
              </div>
            </div>
          ) : (
            <div style={{
              padding: '40px', borderRadius: 24, border: '1px solid #2A2E2A',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: '#6B6F6B', fontSize: 22 }}>Sin valor detectado en este partido</span>
            </div>
          )}

          {/* ── MODELO VS MERCADO ── */}
          {bars.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              <span style={{ color: '#6B6F6B', fontSize: 12, letterSpacing: 2, marginBottom: 18 }}>
                MODELO VS MERCADO · {(MARKET_LABEL[mkt] ?? mkt).toUpperCase()}
              </span>
              {bars.map((b, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', marginBottom: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
                    <span style={{ color: '#D0D4D0', fontSize: 15, fontWeight: 600 }}>{b.selection}</span>
                    <span style={{ color: edgeColor(b.edgePct), fontSize: 15, fontWeight: 700 }}>
                      {b.edgePct > 0 ? '+' : ''}{b.edgePct.toFixed(1)}%
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
                    <span style={{ color: '#6B6F6B', fontSize: 11, width: 28 }}>MOD</span>
                    <div style={{ display: 'flex', width: barW, height: barH, background: '#1E201E', borderRadius: 5, overflow: 'hidden' }}>
                      <div style={{ display: 'flex', width: Math.round(b.modelPct / 100 * barW), height: barH, background: edgeColor(b.edgePct), borderRadius: 5 }} />
                    </div>
                    <span style={{ color: '#D0D4D0', fontSize: 13, width: 36 }}>{Math.round(b.modelPct)}%</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ color: '#6B6F6B', fontSize: 11, width: 28 }}>MKT</span>
                    <div style={{ display: 'flex', width: barW, height: barH, background: '#1E201E', borderRadius: 5, overflow: 'hidden' }}>
                      <div style={{ display: 'flex', width: Math.round(b.marketPct / 100 * barW), height: barH, background: '#3A3E3A', borderRadius: 5 }} />
                    </div>
                    <span style={{ color: '#6B6F6B', fontSize: 13, width: 36 }}>{Math.round(b.marketPct)}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── FOOTER ── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#3A3E3A', fontSize: 12 }}>linea-oculta-v4.vercel.app</span>
            <span style={{ color: '#3A3E3A', fontSize: 12 }}>Análisis estadístico · Sin garantías · Juega responsablemente</span>
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
