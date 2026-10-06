import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { issueApiKey } from '@/lib/api-keys';
import { resolveRequestAuth } from '@/lib/auth/server';
import { badRequest, unauthorized } from '@/lib/api/responses';

const bodySchema = z.object({ userId: z.string().min(1), name: z.string().min(1) });

export async function POST(request: NextRequest) {
  const resolved = await resolveRequestAuth(request);
  if ('error' in resolved) return resolved.error;
  if (!resolved.signed) return unauthorized();

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return badRequest();

  return NextResponse.json(await issueApiKey(resolved.auth, parsed.data.userId, parsed.data.name));
}
