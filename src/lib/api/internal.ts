import type { NextRequest } from 'next/server';

export function isInternalCaller(request: NextRequest): boolean {
  const secret = process.env.INTERNAL_API_SECRET;
  return Boolean(secret) && request.headers.get('authorization') === `Bearer ${secret}`;
}
