import { betterAuth } from 'better-auth';
import { passkey } from '@better-auth/passkey';
import { apiKey } from '@better-auth/api-key';
import { oauthProvider } from '@better-auth/oauth-provider';
import { jwt } from 'better-auth/plugins/jwt';
import { genericOAuth, multiSession } from 'better-auth/plugins';
import { nextCookies } from 'better-auth/next-js';
import { getDb } from '@Hashibutogarasu/db/client';
import { createAuthOptions, type Db } from '@/lib/auth/auth-options';
import { getMockOAuthProviders, getMockOAuthUrl } from '@/lib/auth/mock-oauth';
import { resetInheritedJwks } from '@/lib/auth/preview-jwks';
import { getServerConfig } from '@/lib/config';

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

let authInstance: Promise<Auth> | undefined;

async function initAuth(db: Db): Promise<Auth> {
  const instance = createAuth(db);
  await resetInheritedJwks(instance, db);
  return instance;
}

/** Returns the better-auth instance backed by `DATABASE_URL`, creating it on first use. */
export function getAuth(): Promise<Auth> {
  authInstance ??= initAuth(getDb());
  return authInstance;
}
