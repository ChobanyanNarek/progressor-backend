import type { Response } from 'express';

/*
 * Send a large, already-plain response body as JSON, skipping the global
 * ClassSerializerInterceptor. That interceptor walks every nested object through
 * class-transformer -- about 100x the cost of JSON.stringify -- and on megabyte payloads
 * (Jira searches, GitHub pull request pages, a user's records) it blocked the
 * single-threaded instance past Render's 5s health check (2026-09-24). Use only for bodies
 * with nothing to transform or exclude.
 */
export function sendJson(res: Response, body: unknown): void {
  res.type('application/json').send(JSON.stringify(body));
}
