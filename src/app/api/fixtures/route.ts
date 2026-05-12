import { NextRequest, NextResponse } from 'next/server';
import { Competition } from '@/lib/contracts/pick';
import { ApiResponse } from '@/lib/contracts/pick';
import { NormalizedFixture } from '@/lib/contracts/fixture';
import { getFixtures, getFixturesForAllCompetitions } from '@/services/fixtures';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const competition = req.nextUrl.searchParams.get('competition') as Competition | null;

  try {
    let fixtures: NormalizedFixture[];

    if (!competition) {
      fixtures = await getFixturesForAllCompetitions();
    } else if (competition === 'LIGA_MX' || competition === 'WC_2026') {
      fixtures = await getFixtures(competition);
    } else {
      const body: ApiResponse<null> = {
        data: null,
        status: 'INVALID_COMPETITION',
        message: `competition must be LIGA_MX or WC_2026, got: ${competition}`,
      };
      return NextResponse.json(body, { status: 400 });
    }

    const body: ApiResponse<NormalizedFixture[]> = { data: fixtures, status: 'OK' };
    return NextResponse.json(body);
  } catch (err) {
    console.error('[GET /api/fixtures]', err);
    const body: ApiResponse<null> = { data: null, status: 'PROVIDER_ERROR', message: String(err) };
    return NextResponse.json(body, { status: 500 });
  }
}
