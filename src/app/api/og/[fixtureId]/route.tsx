import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

type Params = { params: Promise<{ fixtureId: string }> };

const MARKET_LABEL: Record<string, string> = {
  MATCH_WINNER: 'Match Winner',
  BTTS:         'Ambos Anotan',
  OVER_UNDER_25:'Total Goles',
};

interface PickBar { selection: string; modelPct: number; marketPct: number; edgePct: number; }

const SIZE = 1080;

function edgeColor(e: number) {
  return e > 5 ? '#00E062' : e > 2 ? '#F5A623' : e < -2 ? '#E53935' : '#6B6F6B';
}

export async function GET(req: NextRequest, { params }: Params) {
  const { fixtureId } = await params;
  const p = req.nextUrl.searchParams;

  const home       = p.get('home')       ?? '';
  const away       = p.get('away')       ?? '';
  const homeLogo   = p.get('homeLogo')   ?? '';
  const awayLogo   = p.get('awayLogo')   ?? '';
  const competition= p.get('competition')?? '';
  const kickoff    = p.get('kickoff')    ?? '';
  const label      = p.get('label')      ?? '';
  const market     = p.get('market')     ?? '';
  const pick       = p.get('pick')       ?? '';
  const odds       = p.get('odds')       ?? '';
  const edgePct    = parseFloat(p.get('edge')      ?? '0');
  const modelPct   = parseFloat(p.get('modelPct')  ?? '0');
  const fairPct    = parseFloat(p.get('fairPct')   ?? '0');

  // bars data: JSON array of {selection,modelPct,marketPct,edgePct}
  let bars: PickBar[] = [];
  try { bars = JSON.parse(p.get('bars') ?? '[]'); } catch {}

  const isValue = label === 'VALUE';
  const accent  = isValue ? '#00E062' : label === 'LEAN' ? '#F5A623' : '#9A9E9A';
  const hasPick = !!pick;

  if (!home || !away) {
    return new Response('Missing params', { status: 400 });
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
            <span style={{ color: '#9A9E9A', fontSize: 14, letterSpacing: 1 }}>{competition.toUpperCase()}</span>
            <span style={{ color: '#6B6F6B', fontSize: 12 }}>{kickoff}</span>
          </div>
        </div>

        {/* TEAMS */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 52px 0', gap: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, flex: 1 }}>
            {homeLogo
              ? <img src={homeLogo} width={96} height={96} style={{ objectFit: 'contain', borderRadius: '50%', background: '#1E201E' }} />
              : <div style={{ width: 96, height: 96, borderRadius: '50%', background: '#1E201E' }} />
            }
            <span style={{ color: '#F0F2F0', fontSize: 26, fontWeight: 700, textAlign: 'center', lineHeight: 1.2 }}>{home}</span>
          </div>
          <span style={{ color: '#2A2E2A', fontSize: 24, fontWeight: 700, padding: '0 20px' }}>VS</span>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, flex: 1 }}>
            {awayLogo
              ? <img src={awayLogo} width={96} height={96} style={{ objectFit: 'contain', borderRadius: '50%', background: '#1E201E' }} />
              : <div style={{ width: 96, height: 96, borderRadius: '50%', background: '#1E201E' }} />
            }
            <span style={{ color: '#F0F2F0', fontSize: 26, fontWeight: 700, textAlign: 'center', lineHeight: 1.2 }}>{away}</span>
          </div>
        </div>

        {/* Divider */}
        <div style={{ margin: '32px 52px 0', height: 1, background: `linear-gradient(to right, transparent, ${accent}44, transparent)` }} />

        {/* PICK */}
        {hasPick ? (
          <div style={{
            margin: '24px 52px 0', padding: '24px 32px',
            borderRadius: 20,
            background: isValue ? '#0D1A12DD' : '#1A1610DD',
            border: `1px solid ${accent}44`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  padding: '4px 12px', borderRadius: 6,
                  background: `${accent}22`, border: `1px solid ${accent}55`,
                  color: accent, fontSize: 13, fontWeight: 800, letterSpacing: 1.5,
                }}>{label}</div>
                <span style={{ color: '#9A9E9A', fontSize: 12, letterSpacing: 1 }}>
                  {(MARKET_LABEL[market] ?? market).toUpperCase()}
                </span>
              </div>
              <span style={{ color: '#F0F2F0', fontSize: 30, fontWeight: 700, lineHeight: 1.1 }}>{pick}</span>
              <span style={{ color: '#6B6F6B', fontSize: 12 }}>
                modelo {modelPct.toFixed(1)}% · mercado {fairPct.toFixed(1)}%
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
              <span style={{ color: accent, fontSize: 72, fontWeight: 900, lineHeight: 1, letterSpacing: -2 }}>{odds}</span>
              <span style={{ color: accent, fontSize: 20, fontWeight: 700 }}>
                {edgePct > 0 ? '+' : ''}{edgePct.toFixed(1)}% edge
              </span>
            </div>
          </div>
        ) : (
          <div style={{
            margin: '24px 52px 0', padding: '32px',
            borderRadius: 20, border: '1px solid #2A2E2A',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: '#6B6F6B', fontSize: 20 }}>Sin valor detectado en este partido</span>
          </div>
        )}

        {/* BARS */}
        {bars.length > 0 && (
          <div style={{ margin: '20px 52px 0', display: 'flex', flexDirection: 'column', gap: 0 }}>
            <span style={{ color: '#6B6F6B', fontSize: 11, letterSpacing: 2, marginBottom: 14 }}>
              MODELO VS MERCADO · {(MARKET_LABEL[market] ?? market).toUpperCase()}
            </span>
            {bars.map((b) => {
              const eColor = edgeColor(b.edgePct);
              return (
                <div key={b.selection} style={{ display: 'flex', flexDirection: 'column', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ color: '#C8CCC8', fontSize: 13, fontWeight: 600 }}>{b.selection}</span>
                    <span style={{ color: eColor, fontSize: 13, fontWeight: 700 }}>
                      {b.edgePct > 0 ? '+' : ''}{b.edgePct.toFixed(1)}%
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span style={{ color: '#6B6F6B', fontSize: 10, width: 26, textAlign: 'right' }}>MOD</span>
                    <div style={{ flex: 1, height: 7, background: '#1E201E', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${b.modelPct}%`, height: '100%', background: eColor, borderRadius: 3 }} />
                    </div>
                    <span style={{ color: '#C8CCC8', fontSize: 11, width: 30 }}>{Math.round(b.modelPct)}%</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: '#6B6F6B', fontSize: 10, width: 26, textAlign: 'right' }}>MKT</span>
                    <div style={{ flex: 1, height: 7, background: '#1E201E', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${b.marketPct}%`, height: '100%', background: '#3A3E3A', borderRadius: 3 }} />
                    </div>
                    <span style={{ color: '#6B6F6B', fontSize: 11, width: 30 }}>{Math.round(b.marketPct)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* FOOTER */}
        <div style={{ position: 'absolute', bottom: 32, left: 52, right: 52, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#3A3E3A', fontSize: 11 }}>linea-oculta-v4.vercel.app</span>
          <span style={{ color: '#3A3E3A', fontSize: 11 }}>Análisis estadístico · Sin garantías</span>
        </div>
      </div>
    ),
    { width: SIZE, height: SIZE }
  );
}
