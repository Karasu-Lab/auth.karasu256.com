import { test, expect, type APIRequestContext } from '@playwright/test';
import { ACCOUNTS_URL, AUTH_URL } from '../playwright.config';
import { uniqueEmail } from './helpers';

interface SignedAuthRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
}

type SignedRequestTarget =
  | { target: 'issue-api-key'; userId: string; name: string; dbBranch?: string | null; timestampOffsetMs?: number }
  | { target: 'get-session'; dbBranch?: string | null; timestampOffsetMs?: number };

const SIGNATURE_HEADER = 'x-signature';
const TIMESTAMP_HEADER = 'x-signature-timestamp';
const DB_BRANCH_HEADER = 'x-db-branch';

async function issuedByAccounts(request: APIRequestContext, target: SignedRequestTarget): Promise<SignedAuthRequest> {
  const res = await request.post(`${ACCOUNTS_URL}/api/test/signed-request`, { data: target });
  expect(res.ok()).toBeTruthy();
  return (await res.json()) as SignedAuthRequest;
}

function send(request: APIRequestContext, signed: SignedAuthRequest) {
  return request.fetch(signed.url, { method: signed.method, headers: signed.headers, data: signed.body });
}

async function apiKeyNames(request: APIRequestContext): Promise<string[]> {
  const res = await request.get(`${ACCOUNTS_URL}/api/api-keys`);
  expect(res.ok()).toBeTruthy();
  return ((await res.json()) as { name: string | null }[]).map((key) => key.name ?? '');
}

test.describe('signed requests from accounts', () => {
  let userId: string;
  let email: string;

  test.beforeEach(async ({ request }) => {
    email = uniqueEmail('signature');
    const res = await request.post(`${AUTH_URL}/api/auth/sign-up/email`, {
      headers: { Origin: AUTH_URL },
      data: { email, password: `pw-${crypto.randomUUID()}`, name: email },
    });
    expect(res.ok()).toBeTruthy();
    userId = ((await res.json()) as { user: { id: string } }).user.id;
  });

  test('accepts an API key request sent exactly as accounts issued it', async ({ request }) => {
    const name = `untouched-${Date.now()}`;
    const signed = await issuedByAccounts(request, { target: 'issue-api-key', userId, name });

    const res = await send(request, signed);
    expect(res.status()).toBe(200);
    expect(((await res.json()) as { key?: string }).key).toBeTruthy();
    expect(await apiKeyNames(request)).toContain(name);
  });

  test('accepts a session request sent exactly as accounts issued it', async ({ request }) => {
    const signed = await issuedByAccounts(request, { target: 'get-session' });

    const res = await send(request, signed);
    expect(res.status()).toBe(200);
    expect(((await res.json()) as { user?: { email: string } }).user?.email).toBe(email);
  });

  const tamperings: { name: string; tamper: (signed: SignedAuthRequest) => SignedAuthRequest }[] = [
    { name: 'body', tamper: (s) => ({ ...s, body: s.body!.replace('"name":"', '"name":"tampered-') }) },
    { name: 'path', tamper: (s) => ({ ...s, url: s.url.replace('/api/internal/api-keys', '/api/auth/api-key/create') }) },
    { name: 'query', tamper: (s) => ({ ...s, url: `${s.url}?tampered=1` }) },
    { name: 'database branch', tamper: (s) => ({ ...s, headers: { ...s.headers, [DB_BRANCH_HEADER]: 'preview/tampered' } }) },
    { name: 'timestamp', tamper: (s) => ({ ...s, headers: { ...s.headers, [TIMESTAMP_HEADER]: String(Number(s.headers[TIMESTAMP_HEADER]) + 1) } }) },
    {
      name: 'signature',
      tamper: (s) => {
        const signature = s.headers[SIGNATURE_HEADER];
        const flipped = `${signature[0] === 'A' ? 'B' : 'A'}${signature.slice(1)}`;
        return { ...s, headers: { ...s.headers, [SIGNATURE_HEADER]: flipped } };
      },
    },
    {
      name: 'missing signature',
      tamper: (s) => {
        const headers = { ...s.headers };
        delete headers[SIGNATURE_HEADER];
        return { ...s, headers };
      },
    },
    {
      name: 'all signature headers removed',
      tamper: (s) => {
        const headers = { ...s.headers };
        delete headers[SIGNATURE_HEADER];
        delete headers[TIMESTAMP_HEADER];
        delete headers[DB_BRANCH_HEADER];
        return { ...s, headers };
      },
    },
  ];

  for (const { name: tampering, tamper } of tamperings) {
    test(`rejects an API key request with a tampered ${tampering}`, async ({ request }) => {
      const name = `tampered-${tampering.replace(/\s/g, '-')}-${Date.now()}`;
      const signed = await issuedByAccounts(request, { target: 'issue-api-key', userId, name });

      const res = await send(request, tamper(signed));
      expect(res.status()).toBe(401);
      expect((await apiKeyNames(request)).some((n) => n.includes(name))).toBe(false);
    });
  }

  test('rejects a session request with a tampered path', async ({ request }) => {
    const signed = await issuedByAccounts(request, { target: 'get-session' });

    const res = await send(request, { ...signed, url: `${signed.url}?tampered=1` });
    expect(res.status()).toBe(401);
  });

  test('rejects a correctly signed request whose timestamp has expired', async ({ request }) => {
    const name = `expired-${Date.now()}`;
    const signed = await issuedByAccounts(request, { target: 'issue-api-key', userId, name, timestampOffsetMs: -10 * 60 * 1000 });

    const res = await send(request, signed);
    expect(res.status()).toBe(401);
    expect(await apiKeyNames(request)).not.toContain(name);
  });

  test('rejects a correctly signed request for the production database branch', async ({ request }) => {
    const name = `production-branch-${Date.now()}`;
    const signed = await issuedByAccounts(request, { target: 'issue-api-key', userId, name, dbBranch: 'main' });

    const res = await send(request, signed);
    expect(res.status()).toBe(400);
    expect(await apiKeyNames(request)).not.toContain(name);
  });
});
