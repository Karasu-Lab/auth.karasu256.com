/**
 * Regression tests for the provider profile API
 * (GET /api/users/me/providers/[providerId]/details).
 *
 * The accounts app's linking page judges the linked state solely by
 * this API: a provider counts as linked exactly when a profile comes
 * back. In production, providers that were linked were judged as not
 * linked. The route forwards the request to api-auth, whose signature
 * gate answers 401 to any signed request that does not verify against
 * the key the api-auth side holds — and this route signed its forward
 * with this app's own key, which does not match in the reported
 * environment. The endpoint on api-auth judges by the session cookie
 * alone, so the signature only ever stood in the way.
 *
 * These tests drive the real route against a stub of api-auth that
 * reproduces those conditions (see ./api-auth-stub.ts), with this
 * app's key deliberately different from api-auth's:
 *
 * 1. A linked provider's profile comes back with 200.
 * 2. A provider that is not linked answers 404.
 * 3. Without a valid session the answer is 401.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiAuthStub } from './api-auth-stub';

const requestCookie: { value: string | null } = { value: 'better-auth.session_token=test-session-token' };

vi.mock('next/headers', () => ({
  headers: async () => new Headers(requestCookie.value ? { cookie: requestCookie.value } : {}),
}));

vi.mock('@karasu-lab/utils/server', async () => {
  const signature = await import('@karasu-lab/utils/server/request-signature');
  const bypass = await import('@karasu-lab/utils/server/vercel-bypass');

  class MissingEnvError extends Error {
    readonly variableName: string;
    constructor(variableName: string) {
      super(`Missing required environment variable: ${variableName}`);
      this.name = 'MissingEnvError';
      this.variableName = variableName;
    }
  }

  return {
    signRequest: signature.signRequest,
    verifyRequest: signature.verifyRequest,
    vercelProtectionBypassHeaders: bypass.vercelProtectionBypassHeaders,
    MissingEnvError,
  };
});

import { GET } from './route';

const githubProfile = { name: 'GitHub User', email: 'github@example.com', image: null };

describe('provider profile API', () => {
  beforeEach(() => {
    requestCookie.value = 'better-auth.session_token=test-session-token';
    /* This app signs with its own value, which does not match the key
       api-auth holds — the reported production condition. */
    vi.stubEnv('INTERNAL_API_SECRET', 'auth-app-side-key');
    vi.stubEnv('AUTH_API_URL', 'https://api-auth.karasu256.com');
    vi.stubGlobal('fetch', vi.fn(createApiAuthStub('api-auth-side-key', { github: githubProfile })));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('returns the profile of a linked provider', async () => {
    const res = await GET(new Request('https://auth.karasu256.com/api/users/me/providers/github/details'), {
      params: Promise.resolve({ providerId: 'github' }),
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(githubProfile);
  });

  it('answers 404 for a provider that is not linked', async () => {
    const res = await GET(new Request('https://auth.karasu256.com/api/users/me/providers/google/details'), {
      params: Promise.resolve({ providerId: 'google' }),
    });

    expect(res.status).toBe(404);
  });

  it('answers 401 without a valid session', async () => {
    requestCookie.value = null;

    const res = await GET(new Request('https://auth.karasu256.com/api/users/me/providers/github/details'), {
      params: Promise.resolve({ providerId: 'github' }),
    });

    expect(res.status).toBe(401);
  });
});
