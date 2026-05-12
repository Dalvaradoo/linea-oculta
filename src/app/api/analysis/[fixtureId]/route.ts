import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse } from '@/lib/contracts/pick';
import { AnalysisResult } from '@/lib/contracts/analysis';
import { getFixtures } from '@/services/fixtures';
import { getOdds } from '@/services/odds';
import { getTeamStats } from '@/services/team-stats';
import { runAnalysis } from '@/lib/analysis/run';

type Params = { params: Promise<{ fixtureId: string }> };

export async function GET(_req: NextRequest, { params }: Params): Promise<NextResponse> {
  const { fixtureId } = await params;

  // Find the fixture across all competitions
  const [ligaMx, wc] = await Promise.all([
    getFixtures('LIGA_MX'),
    getFixtures('WC_2026'),
  ]);
  const fixture = [...ligaMx, ...wc].find((f) => f.id === fixtureId);

  if (!fixture) {
    const body: ApiResponse<null> = {
      data: null,
      status: 'FIXTURE_NOT_FOUND',
      message: `Fixture ${fixtureId} not found`,
    };
    return NextResponse.json(body, { status: 404 });
  }

  // Fetch odds + both team stats in parallel
  const [odds, homeStats, awayStats] = await Promise.all([
    getOdds(fixtureId, fixture.competition),
    getTeamStats(fixture.homeTeam.id, fixture.competition),
    getTeamStats(fixture.awayTeam.id, fixture.competition),
  ]);

  try {
    const analysis = runAnalysis(fixture, odds, homeStats, awayStats);
    const body: ApiResponse<AnalysisResult> = { data: analysis, status: 'OK' };
    return NextResponse.json(body);
  } catch (err) {
    console.error('[GET /api/analysis]', err);
    const body: ApiResponse<null> = {
      data: null,
      status: 'ANALYSIS_ERROR',
      message: String(err),
    };
    return NextResponse.json(body, { status: 500 });
  }
}
