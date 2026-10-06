import type { GenericOAuthConfig } from 'better-auth/plugins';

export function getMockOAuthUrl(): string | null {
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV) return null;
  return process.env.E2E_MOCK_OAUTH_URL || null;
}

export function getMockOAuthProviders(mockUrl: string): GenericOAuthConfig[] {
  return ['google', 'github'].map((providerId) => ({
    providerId,
    clientId: `mock-${providerId}`,
    clientSecret: `mock-${providerId}-secret`,
    authorizationUrl: `${mockUrl}/${providerId}/authorize`,
    tokenUrl: `${mockUrl}/${providerId}/token`,
    userInfoUrl: `${mockUrl}/${providerId}/userinfo`,
    scopes: ['openid', 'email', 'profile'],
    pkce: true,
  }));
}
