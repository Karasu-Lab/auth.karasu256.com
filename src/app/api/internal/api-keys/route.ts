import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { issueApiKey } from '@/lib/api-keys';
import { isInternalCaller } from '@/lib/api/internal';
import { badRequest, unauthorized } from '@/lib/api/responses';

const bodySchema = z.object({ userId: z.string().min(1), name: z.string().min(1) });

export async function POST(request: NextRequest) {
  if (!isInternalCaller(request)) return unauthorized();

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return badRequest();

  return NextResponse.json(await issueApiKey(request.headers, parsed.data.userId, parsed.data.name));
}
