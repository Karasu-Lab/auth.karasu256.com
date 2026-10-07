import type { NextRequest } from 'next/server';
import { getAuth } from '@/lib/auth/server';
import { handlePreflight, withCors } from '@/lib/auth/cors';

async function handle(request: NextRequest): Promise<Response> {
  const auth = await getAuth();
  return auth.handler(request);
}

export const GET = withCors(handle);
export const POST = withCors(handle);
export const OPTIONS = handlePreflight;
