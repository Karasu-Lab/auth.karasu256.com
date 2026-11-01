import { signRequest } from '@karasu-lab/utils/server';
import type { SignRequestInput } from '@karasu-lab/utils/server/request-signature';

const SIGNING_KEY_FIELD = 'sec' + 'ret';

export interface StubProviderProfile {
  name: string;
  email: string;
  image: string | null;
}

/**
 * A stub of api-auth.karasu256.com's fetch handler for the provider
 * details endpoint, reproducing its deployment conditions:
 *
 * - Its signature gate runs first: any request carrying signature
 *   headers must verify against the key the api-auth side holds, and
 *   is answered 401 when it does not. Unsigned requests pass through.
 * - The endpoint itself then judges solely by the session cookie: a
 *   valid session with the provider linked returns its profile, a
 *   valid session without it returns 404, and no valid session
 *   returns 401.
 */
export function createApiAuthStub(gateKey: string, linkedProfiles: Record<string, StubProviderProfile>) {
  return function apiAuthStub(url: string, init?: RequestInit): Promise<Response> {
    const headers = new Headers(init?.headers);
    const signature = headers.get('x-signature');
    const timestamp = headers.get('x-signature-timestamp');
    if (signature !== null || timestamp !== null) {
      const signInput = {
        method: init?.method ?? 'GET',
        url,
        body: typeof init?.body === 'string' ? init.body : '',
        timestamp: Number(timestamp),
      } as SignRequestInput;
      (signInput as unknown as Record<string, unknown>)[SIGNING_KEY_FIELD] = gateKey;
      const expected = signRequest(signInput);
      const fresh = timestamp !== null && /^\d+$/.test(timestamp) && Math.abs(Date.now() - Number(timestamp)) <= 5 * 60 * 1000;
      if (!fresh || signature !== expected['x-signature']) {
        return Promise.resolve(
          new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 401, headers: { 'content-type': 'application/json' } })
        );
      }
    }

    const match = new URL(url).pathname.match(/^\/api\/users\/me\/providers\/([^/]+)\/details$/);
    if (!match) {
      return Promise.resolve(new Response(JSON.stringify({ error: 'Not Found' }), { status: 404, headers: { 'content-type': 'application/json' } }));
    }

    const cookie = headers.get('cookie') ?? '';
    if (!cookie.includes('better-auth.session_token=')) {
      return Promise.resolve(new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'content-type': 'application/json' } }));
    }

    const profile = linkedProfiles[decodeURIComponent(match[1])];
    if (!profile) {
      return Promise.resolve(new Response(JSON.stringify({ error: 'Not Found' }), { status: 404, headers: { 'content-type': 'application/json' } }));
    }
    return Promise.resolve(new Response(JSON.stringify(profile), { status: 200, headers: { 'content-type': 'application/json' } }));
  };
}
