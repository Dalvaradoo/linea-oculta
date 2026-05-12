const BASE_URL = 'https://apiv3.apifootball.com';
const MAX_RETRIES = 3;
const RETRY_BASE_MS = 500;

export class ApifootballError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'ApifootballError';
  }
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function apifbFetch<T>(
  params: Record<string, string>,
  apiKey: string
): Promise<T> {
  const url = new URL(BASE_URL);
  url.searchParams.set('APIkey', apiKey);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  let lastError: Error = new Error('Unknown error');

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (attempt > 0) await sleep(RETRY_BASE_MS * 2 ** (attempt - 1));

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

    if (!res.ok) {
      throw new ApifootballError(`apifootball returned ${res.status}`);
    }

    const json = await res.json();

    if (json && typeof json === 'object' && 'error' in json) {
      throw new ApifootballError(json.message ?? 'API error', String(json.error));
    }

    return json as T;
  }

  throw lastError;
}
