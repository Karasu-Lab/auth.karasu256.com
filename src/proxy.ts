import { NextResponse, type NextRequest } from 'next/server';
import { verifyRequest } from '@Hashibutogarasu/utils/server';
import { getDbBranchFromCookie, isProduction, RESOLVED_DB_BRANCH_HEADER, validateSignedDbBranch } from '@/lib/db-branch';

const DEV_ONLY_PREFIX = '/api/dev/';
const SIGNATURE_REQUIRED_PREFIX = '/api/internal/';

function error(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Verifies requests signed by accounts.karasu256.com and resolves the database
 * branch for every request in one place: signed requests take it only from the
 * signed header, unsigned browser requests from the `db_branch` cookie. Route
 * handlers read the result from {@link RESOLVED_DB_BRANCH_HEADER}.
 */
export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith(DEV_ONLY_PREFIX) && isProduction()) return error('Not Found', 404);

  const secret = process.env.INTERNAL_API_SECRET ?? '';
  const body = request.method === 'GET' || request.method === 'HEAD' ? '' : await request.clone().text();
  const result = verifyRequest({ secret, method: request.method, url: request.url, headers: request.headers, body });

  let dbBranch: string | null;
  if (result.status === 'unsigned') {
    if (pathname.startsWith(SIGNATURE_REQUIRED_PREFIX)) return error('Unauthorized', 401);
    dbBranch = getDbBranchFromCookie(request.headers);
  } else {
    if (result.status === 'invalid' || !secret) return error('Invalid signature', 401);
    const branch = validateSignedDbBranch(result.dbBranch);
    if (!branch.ok) return error('Invalid database branch', 400);
    dbBranch = branch.branch;
  }

  const headers = new Headers(request.headers);
  headers.delete(RESOLVED_DB_BRANCH_HEADER);
  if (dbBranch) headers.set(RESOLVED_DB_BRANCH_HEADER, dbBranch);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
