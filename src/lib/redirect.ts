import type { ClientConfig } from '@/lib/auth/client-config';

export function resolveRedirectTo(raw: string | null | undefined, trustedOrigins: readonly string[], fallback: string): string {
  if (!raw) return fallback;

  if (raw.startsWith('/') && !raw.startsWith('//') && !raw.startsWith('/\\')) return raw;

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return fallback;
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') return fallback;
  if (!trustedOrigins.includes(url.origin)) return fallback;
  return url.toString();
}

type RedirectConfig = Pick<ClientConfig, 'accountsUrl' | 'trustedOrigins'>;

export function getDefaultRedirectTo(config: RedirectConfig): string {
  return `${config.accountsUrl}/settings`;
}

export function getRedirectTo(raw: string | null | undefined, config: RedirectConfig): string {
  return resolveRedirectTo(raw, config.trustedOrigins, getDefaultRedirectTo(config));
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
