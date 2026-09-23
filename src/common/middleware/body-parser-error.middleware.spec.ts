import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { gzipSync } from 'node:zlib';

import { describe, expect, it } from '@jest/globals';
import express from 'express';
import request from 'supertest';

import { bodyParserErrorHandler } from './body-parser-error.middleware.ts';

const ALLOWED = 'https://www.progressor.work';

/*
 * Mirrors main.ts: the real body parser with the real limit, then the handler. Using the
 * actual middleware stack is the point -- the bug was an interaction between body-parser
 * and CORS that a mock would not reproduce.
 */
function app(limit = '1kb'): express.Express {
  const server = express();

  server.use(express.json({ limit }));
  server.use(bodyParserErrorHandler(new Set([ALLOWED])));
  server.put('/state', (_req, res) => {
    res.status(200).json({ ok: true });
  });

  return server;
}

interface IRawResponse {
  status: number;
  allowOrigin?: string;
}

/*
 * PUT a raw body over plain HTTP. supertest re-encodes Buffer bodies, which would not
 * reproduce the exact bytes a browser sends for a gzip upload.
 */
function rawPut(
  server: http.Server,
  body: Buffer,
  headers: Array<[string, string | number]>,
): Promise<IRawResponse> {
  const { port } = server.address() as AddressInfo;

  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        port,
        path: '/state',
        method: 'PUT',
        headers: Object.fromEntries(headers),
      },
      (response) => {
        response.resume();
        response.on('end', () => {
          resolve({
            status: response.statusCode ?? 0,
            allowOrigin: response.headers['access-control-allow-origin'],
          });
        });
      },
    );

    req.on('error', reject);
    req.end(body);
  });
}

const oversized = JSON.stringify({ tasks: ['x'.repeat(2048)] });

describe('bodyParserErrorHandler', () => {
  it('answers an oversized body with 413 and the CORS header', async () => {
    const res = await request(app())
      .put('/state')
      .set('Origin', ALLOWED)
      .set('Content-Type', 'application/json')
      .send(oversized);

    expect(res.status).toBe(413);
    expect(res.headers['access-control-allow-origin']).toBe(ALLOWED);
    expect(res.body.message).toBe('error.payloadTooLarge');
  });

  it('measures the limit after gzip decompression', async () => {
    // A tiny compressed upload still inflates past the limit -- this is the real failure.
    const body = gzipSync(oversized);
    const server = app().listen(0);

    const res = await rawPut(server, body, [
      ['Origin', ALLOWED],
      ['Content-Type', 'application/json'],
      ['Content-Encoding', 'gzip'],
      ['Content-Length', body.length],
    ]);

    server.close();

    expect(body.length).toBeLessThan(1024);
    expect(res.status).toBe(413);
    expect(res.allowOrigin).toBe(ALLOWED);
  });

  it('does not grant CORS to an origin that is not allowed', async () => {
    const res = await request(app())
      .put('/state')
      .set('Origin', 'https://evil.example')
      .set('Content-Type', 'application/json')
      .send(oversized);

    expect(res.status).toBe(413);
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('reports malformed JSON as a 400 invalidBody', async () => {
    const res = await request(app())
      .put('/state')
      .set('Origin', ALLOWED)
      .set('Content-Type', 'application/json')
      .send('{not json');

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('error.invalidBody');
  });

  it('lets a body within the limit through', async () => {
    const res = await request(app('20mb'))
      .put('/state')
      .set('Origin', ALLOWED)
      .set('Content-Type', 'application/json')
      .send(oversized);

    expect(res.status).toBe(200);
  });
});
