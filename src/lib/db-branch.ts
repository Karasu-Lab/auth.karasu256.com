const DB_BRANCH_COOKIE = 'db_branch';
const PRODUCTION_DB_BRANCH = 'main';
const BRANCH_NAME_PATTERN = /^[A-Za-z0-9._/-]{1,128}$/;

export function getDbBranchFromHeaders(headers: Headers): string | null {
  if (process.env.VERCEL_ENV === 'production') return null;
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
