import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse } from '@/lib/contracts/pick';
import { getFixturesForAllCompetitions } from '@/services/fixtures';
import { getOdds } from '@/services/odds';
import { getTeamStats } from '@/services/team-stats';
import { runAnalysis } from '@/lib/analysis/run';
import { generateExplanation } from '@/lib/explanation/generator';

type Params = { params: Promise<{ fixtureId: string }> };

export async function GET(req: NextRequest, { params }: Params): Promise<NextResponse> {
  const { fixtureId } = await params;

  // market + selection from query params
  const market = req.nextUrl.searchParams.get('market');
  const selection = req.nextUrl.searchParams.get('selection');

  if (!market || !selection) {
    const body: ApiResponse<null> = {
      data: null, status: 'MISSING_PARAMS',
      message: 'market and selection query params are required',
    };
    return NextResponse.json(body, { status: 400 });
  }

  // Find fixture
  const fixtures = await getFixturesForAllCompetitions();
  const fixture = fixtures.find((f) => f.id === fixtureId);
  if (!fixture) {
    return NextResponse.json(
      { data: null, status: 'FIXTURE_NOT_FOUND' } satisfies ApiResponse<null>,
      { status: 404 }
    );
  }

  // Run analysis to get the specific pick
  const [odds, homeStats, awayStats] = await Promise.all([
    getOdds(fixture),
    getTeamStats(fixture.homeTeam.id, fixture.competition),
    getTeamStats(fixture.awayTeam.id, fixture.competition),
  ]);

  const analysis = runAnalysis(fixture, odds, homeStats, awayStats);
  const marketData = analysis.markets.find((m) => m.market === market);
  const pick = marketData?.picks.find((p) => p.selection === selection);

  if (!pick) {
    return NextResponse.json(
      { data: null, status: 'PICK_NOT_FOUND' } satisfies ApiResponse<null>,
      { status: 404 }
    );
  }

  const explanation = await generateExplanation(
    fixture.homeTeam.name,
    fixture.awayTeam.name,
    fixture.competition,
    pick,
    market
  );

  const body: ApiResponse<{ explanation: string | null }> = {
    data: { explanation },
    status: explanation ? 'OK' : 'EXPLANATION_UNAVAILABLE',
  };
  return NextResponse.json(body);
}
