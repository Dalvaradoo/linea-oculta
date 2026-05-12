import { NextResponse } from 'next/server';

const TIMEOUT_MS = 3000;

async function ping(url: string, headers?: Record<string, string>): Promise<'ok' | 'error'> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const res = await fetch(url, { signal: controller.signal, headers });
    clearTimeout(timer);
    return res.ok || res.status === 401 ? 'ok' : 'error';
  } catch {
    return 'error';
  }
}

export async function GET(): Promise<NextResponse> {
  const afKey = process.env.API_FOOTBALL_KEY ?? '';
  const [apiFootball, theOddsApi] = await Promise.all([
    ping('https://v3.football.api-sports.io/status', { 'x-apisports-key': afKey }),
    ping('https://api.the-odds-api.com/v4/sports?apiKey=ping'),
  ]);

  const status = apiFootball === 'ok' && theOddsApi === 'ok' ? 'ok' : 'degraded';

  return NextResponse.json({
    status,
    providers: { apiFootball, theOddsApi },
    timestamp: new Date().toISOString(),
  });
}
