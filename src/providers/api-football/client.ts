const BASE_URL = 'https://v3.football.api-sports.io';
const MAX_RETRIES = 3;
const RETRY_BASE_MS = 500;

export class ApiFootballError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'ApiFootballError';
  }
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function apiFetch<T>(
  path: string,
  params: Record<string, string | number>,
  apiKey: string
): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, String(v));
  }

  let lastError: Error = new Error('Unknown error');

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await sleep(RETRY_BASE_MS * 2 ** (attempt - 1));
    }

    let res: Response;
    try {
      res = await fetch(url.toString(), {
        headers: {
          'x-apisports-key': apiKey,
          'Accept': 'application/json',
        },
        next: { revalidate: 0 }, // cache handled externally via unstable_cache
      });
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      continue; // retry on network error
    }

    if (res.status === 429) {
      lastError = new ApiFootballError('Rate limited', 429, 'RATE_LIMITED');
      await sleep(RETRY_BASE_MS * 4); // longer wait on 429
      continue;
    }

    if (!res.ok) {
      throw new ApiFootballError(
        `API-Football returned ${res.status}`,
        res.status
      );
    }

    const json = await res.json();

    // API-Football wraps errors in the response body even on 200
    if (json.errors && Object.keys(json.errors).length > 0) {
      const msg = Object.values(json.errors).join(', ');
      throw new ApiFootballError(`API-Football error: ${msg}`, 200, 'API_ERROR');
    }

    return json as T;
  }

  throw lastError;
}
