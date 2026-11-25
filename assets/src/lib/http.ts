/**
 * Throttled fetch with retries.
 *
 * Zenodo allows 100 requests per minute and 5,000 per hour for a logged-in
 * user, so every request waits for its slot (`minIntervalMs` apart). Rate
 * limit answers (429) and server errors (5xx) are retried with backoff;
 * any other error status throws an `HttpError`.
 */

export type RequestOptions = {
  method?: string;
  headers?: Record<string, string>;
  body?: string | Blob;
};

export type HttpClient = {
  request: (url: string, options?: RequestOptions) => Promise<Response>;
  json: <T>(url: string, options?: RequestOptions) => Promise<T>;
};

export class HttpError extends Error {
  readonly status: number;

  constructor(status: number, url: string, body: string) {
    super(`HTTP ${status} for ${url}: ${body.slice(0, 500)}`);
    this.status = status;
  }
}

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const backoffMs = (attempt: number): number =>
  Math.min(60_000, 2_000 * 2 ** attempt);

function retryDelayMs(response: Response, attempt: number): number {
  const retryAfterSeconds = Number(response.headers.get("retry-after"));
  return retryAfterSeconds > 0 ? retryAfterSeconds * 1000 : backoffMs(attempt);
}

export function createHttpClient(config: {
  minIntervalMs: number;
  maxRetries: number;
  headers?: Record<string, string>;
}): HttpClient {
  let nextSlot = 0;

  async function waitForSlot(): Promise<void> {
    const now = Date.now();
    const wait = nextSlot - now;
    nextSlot = Math.max(now, nextSlot) + config.minIntervalMs;
    if (wait > 0) await sleep(wait);
  }

  async function request(
    url: string,
    options: RequestOptions = {},
  ): Promise<Response> {
    for (let attempt = 0; ; attempt++) {
      await waitForSlot();
      let response: Response;
      try {
        response = await fetch(url, {
          method: options.method ?? "GET",
          headers: { ...config.headers, ...options.headers },
          body: options.body,
        });
      } catch (error: unknown) {
        if (attempt >= config.maxRetries) throw error;
        await sleep(backoffMs(attempt));
        continue;
      }
      if (response.ok) return response;

      const body = await response.text();
      const retryable = response.status === 429 || response.status >= 500;
      if (!retryable || attempt >= config.maxRetries) {
        throw new HttpError(response.status, url, body);
      }
      await sleep(retryDelayMs(response, attempt));
    }
  }

  async function json<T>(url: string, options?: RequestOptions): Promise<T> {
    const response = await request(url, options);
    const data: unknown = await response.json();
    // The APIs are trusted; callers read only the fields they declare in T.
    return data as T;
  }

  return { request, json };
}
