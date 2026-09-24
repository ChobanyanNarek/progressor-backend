import { monitorEventLoopDelay } from 'node:perf_hooks';

import { Logger } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

/*
 * Evidence for the next "health check timed out" (2026-09-24): the single-threaded
 * instance fails Render's 5s check whenever something blocks the event loop. These log
 * what was slow, so the cause shows up in Render's logs instead of being guessed.
 */

const logger = new Logger('RuntimeWatch');
const SLOW_REQUEST_MS = 2000;
const LOOP_BLOCK_MS = 1000;

// Requests slower than 2s: method, path (never the query string) and duration.
export function slowRequestLogger(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const started = process.hrtime.bigint();

  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - started) / 1e6;

    if (ms >= SLOW_REQUEST_MS) {
      logger.warn(
        `Slow request: ${req.method} ${req.path} -> ${res.statusCode} in ${Math.round(ms)} ms`,
      );
    }
  });
  next();
}

// Every minute: if the event loop was blocked for over a second, say how long and how full the heap was.
export function watchEventLoop(): void {
  const histogram = monitorEventLoopDelay({ resolution: 20 });

  histogram.enable();
  setInterval(() => {
    const maxMs = histogram.max / 1e6;

    if (maxMs >= LOOP_BLOCK_MS) {
      const heapMb = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);

      logger.warn(
        `Event loop blocked for up to ${Math.round(maxMs)} ms in the last minute; heap ${heapMb} MB`,
      );
    }

    histogram.reset();
  }, 60_000).unref();
}
