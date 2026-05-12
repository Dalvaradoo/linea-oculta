import { NextResponse } from 'next/server';
import { fetchFixtures } from '@/providers/apifootball/fixtures';

export async function GET() {
  const key = process.env.APIFOOTBALL_KEY ?? 'MISSING';

  // Test 1: raw fetch
  let rawResult: unknown;
  try {
    const from = new Date(); const to = new Date(from);
    to.setDate(to.getDate() + 7);
    const fmt = (d: Date) => d.toISOString().split('T')[0];
    const ctrl = new AbortController();
    setTimeout(() => ctrl.abort(), 10_000);
    const url = `https://apiv3.apifootball.com/?action=get_events&from=${fmt(from)}&to=${fmt(to)}&league_id=235&APIkey=${key}`;
    const res = await fetch(url, { signal: ctrl.signal, next: { revalidate: 0 } });
    const text = await res.text();
    rawResult = { ok: res.ok, preview: text.slice(0, 200) };
  } catch (e) { rawResult = { error: String(e) }; }

  // Test 2: through fetchFixtures provider
  let providerResult: unknown;
  try {
    const fixtures = await fetchFixtures('LIGA_MX', key);
    providerResult = { count: fixtures.length, first: fixtures[0]?.homeTeam?.name ?? null };
  } catch (e) { providerResult = { error: String(e) }; }

  return NextResponse.json({ key: key.slice(0, 8) + '...', rawResult, providerResult });
}
