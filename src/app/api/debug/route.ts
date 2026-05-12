import { NextResponse } from 'next/server';

export async function GET() {
  const key = process.env.APIFOOTBALL_KEY ?? 'MISSING';
  const today = new Date().toISOString().split('T')[0];
  const url = `https://apiv3.apifootball.com/?action=get_events&from=${today}&to=${today}&league_id=235&APIkey=${key}`;

  try {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 12_000);
    const res = await fetch(url, { signal: controller.signal, next: { revalidate: 0 } });
    const text = await res.text();
    return NextResponse.json({ ok: res.ok, status: res.status, body: text.slice(0, 500), key: key.slice(0,8)+'...' });
  } catch (err) {
    return NextResponse.json({ error: String(err), key: key.slice(0,8)+'...' });
  }
}
