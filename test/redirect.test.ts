import { describe, expect, it } from 'vitest';
import { completeNativeOAuthLink, getContinueTo, getOAuthErrorUrl, getRedirectTo, isNativeOAuthCallback, resolveRedirectTo } from '../src/lib/redirect';

describe('native OAuth callback redirects', () => {
  it('accepts the app callback URI for a provider', () => {
    const callback = 'karasulab://api/auth/callback/github?state=state-token';

    expect(resolveRedirectTo(callback, null, '/fallback')).toBe(callback);
  });

  it.each([
    'karasulab://attacker/auth/callback/github',
    'karasulab://api/other/callback/github',
    'karasulab://api/auth/callback/github/extra',
    'javascript://api/auth/callback/github',
    'karasulab://user@api/auth/callback/github',
  ])('rejects an invalid app callback URI: %s', (callback) => {
    expect(resolveRedirectTo(callback, null, '/fallback')).toBe('/fallback');
  });

  it('recognizes only provider callback URIs for the app', () => {
    expect(isNativeOAuthCallback('karasulab://api/auth/callback/xbox')).toBe(true);
    expect(isNativeOAuthCallback('karasulab://api/auth/callback/github/extra')).toBe(false);
    expect(isNativeOAuthCallback('karasulab://api/auth/callback/github?redirect=https://evil.test')).toBe(true);
  });

  it('carries the error code to the OAuth error page', () => {
    expect(getOAuthErrorUrl('state_mismatch')).toBe('/oauth/error?error=state_mismatch');
    expect(getOAuthErrorUrl('access_denied')).toBe('/oauth/error?error=access_denied');
    expect(getOAuthErrorUrl(null)).toBe('/oauth/error');
    expect(getOAuthErrorUrl(undefined)).toBe('/oauth/error');
    expect(getOAuthErrorUrl('')).toBe('/oauth/error');
  });

  it('does not redirect anywhere when no destination is given', () => {
    const config = { trustedOrigins: ['https://accounts.karasu256.com', 'https://*.dev-accounts.karasu256.com'], appEnv: 'production' };

    expect(getRedirectTo(null, config)).toBeNull();
    expect(getRedirectTo(undefined, config)).toBeNull();
    expect(getRedirectTo('', config)).toBeNull();
    expect(getContinueTo(new URLSearchParams(), { ...config, authApiUrl: 'https://api-auth.karasu256.com' })).toBeNull();
  });

  it('does not fall back to the accounts settings for an untrusted destination', () => {
    const config = { trustedOrigins: ['https://accounts.karasu256.com'], appEnv: 'production' };

    expect(getRedirectTo('https://evil.example/steal', config)).toBeNull();
    expect(getRedirectTo('https://dev.accounts.karasu256.com/settings', config)).toBeNull();
    expect(getRedirectTo('not a url', config)).toBeNull();
  });

  it('keeps a destination given as a parameter, including a branch deployment', () => {
    const config = { trustedOrigins: ['https://accounts.karasu256.com', 'https://*.dev-accounts.karasu256.com'], appEnv: 'production' };
    const branch = 'https://fix-pin-opennext-cloudflare-1-20-17.dev-accounts.karasu256.com/settings';

    expect(getRedirectTo(branch, config)).toBe(branch);
    expect(getRedirectTo('/oauth/consent?x=1', config)).toBe('/oauth/consent?x=1');
    expect(getContinueTo(new URLSearchParams({ next: branch }), { ...config, authApiUrl: 'https://api-auth.karasu256.com' })).toBe(branch);
  });

  it('returns linked provider callbacks without generating a sign-in token', () => {
    expect(completeNativeOAuthLink('karasulab://api/auth/callback/github?state=state-token-1234567890')).toBe(
      'karasulab://api/auth/callback/github?state=state-token-1234567890&linked=github',
    );
    expect(completeNativeOAuthLink('karasulab://api/auth/callback/github?state=short')).toBeNull();
  });
});
