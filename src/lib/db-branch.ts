const DB_BRANCH_COOKIE = 'db_branch';
const PRODUCTION_DB_BRANCH = 'main';
const BRANCH_NAME_PATTERN = /^[A-Za-z0-9._/-]{1,128}$/;

/** Set only by `proxy.ts` after it has verified the request, never trusted from the client. */
export const RESOLVED_DB_BRANCH_HEADER = 'x-resolved-db-branch';

export function isProduction(): boolean {
  return process.env.VERCEL_ENV === 'production';
}

export function getDbBranchFromCookie(headers: Headers): string | null {
  if (isProduction()) return null;
  const cookieHeader = headers.get('cookie');
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name !== DB_BRANCH_COOKIE) continue;
    const value = decodeURIComponent(rest.join('='));
    return BRANCH_NAME_PATTERN.test(value) && value !== PRODUCTION_DB_BRANCH ? value : null;
  }
  return null;
}

/** Rejects instead of falling back, so a signed request never silently lands on a database it didn't ask for. */
export function validateSignedDbBranch(branch: string | null): { ok: true; branch: string | null } | { ok: false } {
  if (branch === null) return { ok: true, branch: null };
  if (isProduction() || branch === PRODUCTION_DB_BRANCH || !BRANCH_NAME_PATTERN.test(branch)) return { ok: false };
  return { ok: true, branch };
}

export function getResolvedDbBranch(headers: Headers): string | null {
  return headers.get(RESOLVED_DB_BRANCH_HEADER) || null;
}
