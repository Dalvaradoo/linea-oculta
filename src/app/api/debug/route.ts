import { NextResponse } from 'next/server';

export async function GET() {
  const key = process.env.APIFOOTBALL_KEY ?? 'MISSING';

  async function test(label: string, url: string) {
    try {
      const ctrl = new AbortController();
      setTimeout(() => ctrl.abort(), 10_000);
      const res = await fetch(url, { signal: ctrl.signal, next: { revalidate: 0 } });
      const text = await res.text();
      const json = JSON.parse(text);
      const isError = json && typeof json === 'object' && 'error' in json;
      return { label, ok: !isError, preview: text.slice(0, 120) };
    } catch (e) {
      return { label, ok: false, preview: String(e) };
    }
  }

  const base = `https://apiv3.apifootball.com/?APIkey=${key}`;
  const results = await Promise.all([
    test('get_leagues',   `${base}&action=get_leagues`),
    test('get_standings_ligamx', `${base}&action=get_standings&league_id=235`),
    test('get_standings_wc',     `${base}&action=get_standings&league_id=28`),
    test('get_events_7d', (() => {
      const from = new Date(); const to = new Date(from);
      to.setDate(to.getDate() + 7);
      const fmt = (d: Date) => d.toISOString().split('T')[0];
      return `${base}&action=get_events&from=${fmt(from)}&to=${fmt(to)}&league_id=235`;
    })()),
  ]);

  return NextResponse.json({ key: key.slice(0, 8) + '...', results });
}
