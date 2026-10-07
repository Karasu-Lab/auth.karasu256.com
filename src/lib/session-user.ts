import { headers } from 'next/headers';
import { getAuth, type Auth } from '@/lib/auth/server';

/** The authenticated user, as returned by `auth.api.getSession`. */
export type SessionUser = NonNullable<Awaited<ReturnType<Auth['api']['getSession']>>>['user'];

/**
 * Reads and verifies the better-auth session.
 * Returns the session's user when valid, or `null` when absent or invalid.
 *
 * Must only be called from Server Components or Route Handlers.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const requestHeaders = await headers();
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: requestHeaders });
  return session?.user ?? null;
}
