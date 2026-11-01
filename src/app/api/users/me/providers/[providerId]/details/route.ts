import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { vercelProtectionBypassHeaders } from '@karasu-lab/utils/server';

/**
 * Returns the signed-in user's profile for one linked provider.
 *
 * GET /api/users/me/providers/[providerId]/details
 *
 * The caller passes the provider ID of a linked account; when the
 * session carried by the request's cookie is valid and that provider
 * is linked, api-auth.karasu256.com resolves the provider profile from
 * the stored tokens and this route returns it. When the provider is
 * not linked (or its profile cannot be resolved) the response is 404,
 * and when there is no valid session it is 401 — callers judge the
 * linked state solely by whether a profile comes back, never from a
 * data store of their own.
 *
 * This app holds no provider data itself: the request is forwarded,
 * with the session cookie, to the same endpoint on api-auth, which
 * alone can decrypt the stored provider tokens and which performs the
 * session validation. The forward is deliberately not signed: the
 * endpoint authenticates by the session cookie itself, and signing
 * would make this read depend on the two deployments' shared-secret
 * configuration staying in sync, whose mismatch silently degraded
 * every provider to "not linked" (the auth API's signature gate
 * answers 401 to a signed request that does not verify).
 */
export async function GET(_request: Request, { params }: { params: Promise<{ providerId: string }> }) {
  const { providerId } = await params;
  const cookie = (await headers()).get('cookie');

  const base = (process.env.AUTH_API_URL ?? '').replace(/\/+$/, '');
  const res = await fetch(`${base}/api/users/me/providers/${encodeURIComponent(providerId)}/details`, {
    headers: {
      ...(cookie ? { cookie } : {}),
      ...vercelProtectionBypassHeaders(process.env.VERCEL_PROTECTION_BYPASS_SECRET),
    },
    cache: 'no-store',
  }).catch(() => null);
  if (!res) {
    return NextResponse.json({ error: 'Upstream request failed' }, { status: 502 });
  }

  const body: unknown = await res.json().catch(() => null);
  return NextResponse.json(body, { status: res.status });
}
