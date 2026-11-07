import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { vercelProtectionBypassHeaders } from '@karasu-lab/utils/server';

export async function GET() {
  const cookie = (await headers()).get('cookie');

  const base = (process.env.AUTH_API_URL ?? '').replace(/\/+$/, '');
  const res = await fetch(`${base}/api/users/me/providers`, {
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
