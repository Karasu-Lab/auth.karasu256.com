import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { APIError } from 'better-auth/api';
import { getAuth } from '@/lib/auth/server';
import { badRequest } from '@/lib/api/responses';
import { handlePreflight, withCors } from '@/lib/auth/cors';

const bodySchema = z.object({ newPassword: z.string().min(1) });

/**
 * Sets a password for the authenticated user's account, linking a
 * `credential` account if one doesn't already exist. `auth.api.setPassword`
 * is server-only in better-auth (unlike `changePassword`, it has no client
 * counterpart), so this thin route is the only way to expose it to the
 * settings UI.
 *
 * POST /api/auth/set-password
 * Body: { newPassword: string }
 */
async function handlePOST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return badRequest();

  try {
    const auth = await getAuth();
    await auth.api.setPassword({ body: { newPassword: parsed.data.newPassword }, headers: request.headers });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof APIError ? err.message : 'Failed to set password';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export const POST = withCors(handlePOST);
export const OPTIONS = handlePreflight;
