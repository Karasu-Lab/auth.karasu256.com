import { NextResponse, type NextRequest } from 'next/server';
import { getResolvedDbBranch } from '@/lib/db-branch';

/**
 * Reports the database branch this request is served from, falling back to the
 * branch this deployment was built against. `proxy.ts` hides it in production.
 *
 * GET /api/dev/branch
 */
export function GET(request: NextRequest) {
  return NextResponse.json({ branch: getResolvedDbBranch(request.headers) ?? process.env.NEON_BRANCH_NAME ?? null });
}
