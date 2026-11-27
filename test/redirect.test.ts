import { describe, expect, it } from 'vitest';
import { completeNativeOAuthLink, isNativeOAuthCallback, resolveRedirectTo } from '../src/lib/redirect';

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

  it('returns linked provider callbacks without generating a sign-in token', () => {
    expect(completeNativeOAuthLink('karasulab://api/auth/callback/github?state=state-token-1234567890')).toBe(
      'karasulab://api/auth/callback/github?state=state-token-1234567890&linked=github',
    );
    expect(completeNativeOAuthLink('karasulab://api/auth/callback/github?state=short')).toBeNull();
  });
});
