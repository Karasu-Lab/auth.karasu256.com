import type { ClientConfig } from '@/lib/auth/client-config';

function matchesOriginPattern(origin: string, pattern: string): boolean {
  if (!pattern.includes('*')) return origin === pattern;
  const source = pattern
    .split('*')
    .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&'))
    .join('[^/]*');
  return new RegExp(`^${source}$`).test(origin);
}

export function isNativeOAuthCallback(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }

  return (
    url.protocol === 'karasulab:' &&
    url.hostname === 'api' &&
    !url.username &&
    !url.password &&
    !url.port &&
    /^\/auth\/callback\/[a-z0-9-]+$/i.test(url.pathname)
  );
}

export function completeNativeOAuthLink(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }

  const state = url.searchParams.get('state');
  if (!isNativeOAuthCallback(raw) || !state || !/^[A-Za-z0-9_-]{16,128}$/.test(state)) return null;
  url.searchParams.set('linked', url.pathname.split('/').pop() ?? '');
  return url.toString();
}

export function resolveRedirectTo(raw: string | null | undefined, trustedOrigins: readonly string[] | null, fallback: string): string {
  if (!raw) return fallback;

  if (raw.startsWith('/') && !raw.startsWith('//') && !raw.startsWith('/\\')) return raw;

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return fallback;
  }

  if (isNativeOAuthCallback(url.toString())) return url.toString();
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return fallback;
  if (trustedOrigins && !trustedOrigins.some((pattern) => matchesOriginPattern(url.origin, pattern))) return fallback;
  return url.toString();
}

type RedirectConfig = Pick<ClientConfig, 'accountsUrl' | 'trustedOrigins' | 'appEnv'>;

export function getTrustedOrigins(config: Pick<ClientConfig, 'trustedOrigins' | 'appEnv'>): readonly string[] | null {
  return config.appEnv === 'preview' ? null : config.trustedOrigins;
}

export function getDefaultRedirectTo(config: RedirectConfig): string {
  return `${config.accountsUrl}/settings`;
}

export function getRedirectTo(raw: string | null | undefined, config: RedirectConfig): string {
  return resolveRedirectTo(raw, getTrustedOrigins(config), getDefaultRedirectTo(config));
}

export function getOAuthErrorUrl(error?: string | null): string {
  return error ? `/oauth/error?error=${encodeURIComponent(error)}` : '/oauth/error';
}

const OAUTH_SIGNATURE_PARAMS = ['sig', 'exp', 'prompt'];

export function getContinueTo(searchParams: URLSearchParams, config: Pick<ClientConfig, 'authApiUrl'> & RedirectConfig): string {
  if (searchParams.get('sig') && searchParams.get('client_id')) {
    const params = new URLSearchParams();
    for (const [key, value] of searchParams.entries()) {
      if (!OAUTH_SIGNATURE_PARAMS.includes(key) && !params.has(key)) params.set(key, value);
    }
    return `${config.authApiUrl}/api/auth/oauth2/authorize?${params.toString()}`;
  }
  return getRedirectTo(searchParams.get('next'), config);
}
