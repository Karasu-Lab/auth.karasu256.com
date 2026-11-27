import { describe, expect, it, vi } from 'vitest';
import { generateOneTimeToken } from '../src/lib/one-time-token';

function stubAuthApi() {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(input instanceof Request ? input.url : input);
    const method = init?.method ?? (input instanceof Request ? input.method : 'GET');
    if (url.pathname === '/api/auth/one-time-token/generate' && method === 'GET') {
      return Response.json({ token: 'token-value' });
    }
    return new Response('not found', { status: 404 });
  });
}

describe('one-time token generation', () => {
  it('issues a token through the generate endpoint', async () => {
    const fetcher = stubAuthApi();
    await expect(generateOneTimeToken('https://api-auth.test', 'state-token-1234567890', fetcher as unknown as typeof fetch)).resolves.toBe('token-value');
    const [input, init] = fetcher.mock.calls[0] as [RequestInfo | URL, RequestInit | undefined];
    expect(new URL(input as string).searchParams.get('state')).toBe('state-token-1234567890');
    expect(init?.credentials).toBe('include');
  });

  it('throws one_time_token_failed when the endpoint rejects the request', async () => {
    const fetcher = vi.fn(async () => new Response('unauthorized', { status: 401 }));
    await expect(generateOneTimeToken('https://api-auth.test', 'state-token-1234567890', fetcher as unknown as typeof fetch)).rejects.toThrow(
      'one_time_token_failed',
    );
  });
});
