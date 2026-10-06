import type { NextRequest } from 'next/server';
import { resolveRequestAuth } from '@/lib/auth/server';
import { handlePreflight, withCors } from '@/lib/auth/cors';

async function handle(request: NextRequest): Promise<Response> {
  const resolved = await resolveRequestAuth(request);
  if ('error' in resolved) return resolved.error;
  return resolved.auth.handler(request);
}

export const GET = withCors(handle);
export const POST = withCors(handle);
export const OPTIONS = handlePreflight;
