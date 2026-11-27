import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { proxy } from './proxy';

describe('Android asset links proxy', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('rewrites the standard endpoint to api-auth', () => {
    vi.stubEnv('AUTH_API_URL', 'https://dev-api-auth.karasu256.com');
    const response = proxy(new NextRequest('https://dev-auth.karasu256.com/.well-known/assetlinks.json'));

    expect(response.headers.get('x-middleware-rewrite')).toBe('https://dev-api-auth.karasu256.com/.well-known/assetlinks.json');
  });

  it('reports a missing api-auth origin instead of silently falling through', async () => {
    vi.stubEnv('AUTH_API_URL', '');
    const response = proxy(new NextRequest('https://dev-auth.karasu256.com/.well-known/assetlinks.json'));

    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({
      error: 'android_asset_links_unavailable',
      reason: 'AUTH_API_URL is not configured.',
    });
  });
});
