import { betterAuth } from 'better-auth';
import { passkey } from '@better-auth/passkey';
import { apiKey } from '@better-auth/api-key';
import { oauthProvider } from '@better-auth/oauth-provider';
import { jwt } from 'better-auth/plugins/jwt';
import { genericOAuth, multiSession } from 'better-auth/plugins';
import { nextCookies } from 'better-auth/next-js';
import { createDb, getDb } from '@Hashibutogarasu/db/client';
import { createAuthOptions, type Db } from '@/lib/auth/auth-options';
import { getMockOAuthProviders, getMockOAuthUrl } from '@/lib/auth/mock-oauth';
import { resetInheritedJwks } from '@/lib/auth/preview-jwks';
import { getServerConfig } from '@/lib/config';
import { resolveDatabaseUrl } from '@/lib/database-url';
import { getDbBranchFromHeaders } from '@/lib/db-branch';

function createAuth(db: Db) {
  const { webauthn } = getServerConfig();
  const mockOAuthUrl = getMockOAuthUrl();
  return betterAuth({
    ...createAuthOptions(db),
    plugins: [
      jwt(),
      oauthProvider({
        loginPage: '/sign-in',
        consentPage: '/oauth/consent',
        scopes: ['openid', 'profile', 'email', 'offline_access', 'read:profile', 'write:profile'],
        allowDynamicClientRegistration: false,
        accessTokenExpiresIn: 15 * 60,
      }),
      passkey({
        rpID: webauthn.rpId,
        rpName: webauthn.rpName,
        origin: webauthn.expectedOrigins,
      }),
      multiSession({ maximumSessions: 5 }),
      apiKey({ defaultPrefix: 'ksk_', rateLimit: { enabled: false } }),
      ...(mockOAuthUrl ? [genericOAuth({ config: getMockOAuthProviders(mockOAuthUrl) })] : []),
      nextCookies(),
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;

const authByBranch = new Map<string, Promise<Auth>>();
let defaultAuth: Auth | undefined;

async function createBranchAuth(branch: string): Promise<Auth> {
  const db = createDb(await resolveDatabaseUrl(branch));
  const instance = createAuth(db);
  await resetInheritedJwks(instance, db);
  return instance;
}

/**
 * Returns the better-auth instance for the given database branch. Production
 * and requests without a branch use `DATABASE_URL`; other branches keep one
 * cached instance each, so a single fixed host (and its OAuth callback URLs)
 * can serve every preview database.
 */
export function getAuth(branch: string | null): Promise<Auth> {
  if (!branch) {
    defaultAuth ??= createAuth(getDb());
    return Promise.resolve(defaultAuth);
  }
  const existing = authByBranch.get(branch);
  if (existing) return existing;
  const pending = createBranchAuth(branch);
  pending.catch(() => authByBranch.delete(branch));
  authByBranch.set(branch, pending);
  return pending;
}

export function getRequestAuth(headers: Headers): Promise<Auth> {
  return getAuth(getDbBranchFromHeaders(headers));
}
