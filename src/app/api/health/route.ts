import { NextResponse } from 'next/server';

const TIMEOUT_MS = 3000;

async function ping(url: string): Promise<'ok' | 'error'> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    return res.ok || res.status === 401 ? 'ok' : 'error'; // 401 = reachable but bad key
  } catch {
    return 'error';
  }
}

export async function GET(): Promise<NextResponse> {
  const [apiFootball, theOddsApi] = await Promise.all([
    ping('https://v3.football.api-sports.io/status'),
    ping('https://api.the-odds-api.com/v4/sports?apiKey=ping'),
  ]);

  const status = apiFootball === 'ok' && theOddsApi === 'ok' ? 'ok' : 'degraded';

  return NextResponse.json({
    status,
    providers: { apiFootball, theOddsApi },
    timestamp: new Date().toISOString(),
  });
}
