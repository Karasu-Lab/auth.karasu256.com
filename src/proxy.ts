import { NextResponse, type NextRequest } from 'next/server';
import { verifyRequest } from '@Hashibutogarasu/utils/server';

const SIGNATURE_REQUIRED_PREFIX = '/api/internal/';

function error(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Verifies requests signed by accounts.karasu256.com: a request carrying signature
 * headers must verify, and `/api/internal/` accepts only signed requests.
 */
export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  const secret = process.env.INTERNAL_API_SECRET ?? '';
  const body = request.method === 'GET' || request.method === 'HEAD' ? '' : await request.clone().text();
  const result = verifyRequest({ secret, method: request.method, url: request.url, headers: request.headers, body });

  if (result.status === 'unsigned' && pathname.startsWith(SIGNATURE_REQUIRED_PREFIX)) return error('Unauthorized', 401);
  if (result.status === 'invalid' || (result.status === 'valid' && !secret)) return error('Invalid signature', 401);

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
