import { NextResponse } from 'next/server';

export async function GET() {
  const key = process.env.APIFOOTBALL_KEY ?? 'MISSING';
  const from = new Date();
  const to = new Date(from);
  to.setDate(to.getDate() + 7);
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  const dateRange = `${fmt(from)} → ${fmt(to)}`;
  const url = `https://apiv3.apifootball.com/?action=get_events&from=${fmt(from)}&to=${fmt(to)}&league_id=235&APIkey=${key}`;

  try {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 12_000);
    const res = await fetch(url, { signal: controller.signal, next: { revalidate: 0 } });
    const text = await res.text();
    return NextResponse.json({
      ok: res.ok, status: res.status,
      dateRange,
      body: text.slice(0, 600),
      key: key.slice(0, 8) + '...',
    });
  } catch (err) {
    return NextResponse.json({ error: String(err), dateRange, key: key.slice(0, 8) + '...' });
  }
}
