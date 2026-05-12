const BASE_URL = 'https://api.the-odds-api.com/v4';
const MAX_RETRIES = 3;
const RETRY_BASE_MS = 500;

export class TheOddsApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'TheOddsApiError';
  }
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function oddsFetch<T>(
  path: string,
  params: Record<string, string>,
  apiKey: string
): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  url.searchParams.set('apiKey', apiKey.trim());
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  let lastError: Error = new Error('Unknown error');

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await sleep(RETRY_BASE_MS * 2 ** (attempt - 1));
    }

    let res: Response;
    try {
      res = await fetch(url.toString(), {
        headers: { Accept: 'application/json' },
        next: { revalidate: 0 },
      });
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      continue;
    }

    if (res.status === 429) {
      lastError = new TheOddsApiError('Rate limited', 429, 'RATE_LIMITED');
      await sleep(RETRY_BASE_MS * 4);
      continue;
    }

    if (res.status === 401) {
      throw new TheOddsApiError('Invalid API key', 401, 'UNAUTHORIZED');
    }

    if (!res.ok) {
      throw new TheOddsApiError(`The Odds API returned ${res.status}`, res.status);
    }

    return (await res.json()) as T;
  }

  throw lastError;
}
