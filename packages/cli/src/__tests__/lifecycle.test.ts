import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { buildHealthProbeCandidates, checkHttpHealth } from '../utils/lifecycle';

describe('buildHealthProbeCandidates', () => {
  test('adds a 127.0.0.1 fallback for localhost URLs', () => {
    expect(buildHealthProbeCandidates('http://localhost:38473/api/health')).toEqual([
      'http://localhost:38473/api/health',
      'http://127.0.0.1:38473/api/health',
    ]);
  });

  test('normalizes 0.0.0.0 to a client-safe loopback fallback', () => {
    expect(buildHealthProbeCandidates('http://0.0.0.0:34872')).toEqual([
      'http://0.0.0.0:34872/',
      'http://127.0.0.1:34872/',
    ]);
  });

  test('leaves non-loopback hosts untouched', () => {
    expect(buildHealthProbeCandidates('https://api.example.com/health')).toEqual([
      'https://api.example.com/health',
    ]);
  });
});

describe('checkHttpHealth', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn(async (input: string | URL | Request) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      if (url.includes('127.0.0.1')) {
        return new Response('', { status: 200, statusText: 'OK' });
      }

      throw new Error('fetch failed');
    }) as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('falls back from localhost to 127.0.0.1 when the first request fails', async () => {
    const result = await checkHttpHealth('http://localhost:38473/api/health');

    expect(result).toEqual({
      ok: true,
      detail: '200 OK',
      url: 'http://127.0.0.1:38473/api/health',
      tried: [
        'http://localhost:38473/api/health',
        'http://127.0.0.1:38473/api/health',
      ],
    });
  });
});
