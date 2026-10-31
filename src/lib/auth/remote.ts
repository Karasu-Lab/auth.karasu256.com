import { MissingEnvError, signRequest, vercelProtectionBypassHeaders } from '@karasu-lab/utils/server';

export interface SignedAuthRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
}

export interface SignedAuthRequestOptions {
  method?: string;
  body?: string;
  cookie?: string | null;
  origin?: string;
  timestamp?: number;
}

export function authApiUrl(path: string): string {
  return `${process.env.NEXT_PUBLIC_AUTH_API_URL ?? ''}${path}`;
}

/**
 * Builds a request to api-auth.karasu256.com signed with
 * `INTERNAL_API_SECRET`, forwarding the caller's session cookie so
 * api-auth can validate the session itself. Mirrors the helper the
 * accounts app uses for the same endpoints.
 */
export function buildSignedAuthRequest(path: string, options: SignedAuthRequestOptions = {}): SignedAuthRequest {
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret) throw new MissingEnvError('INTERNAL_API_SECRET');

  const method = options.method ?? 'GET';
  const url = authApiUrl(path);

  return {
    method,
    url,
    body: options.body,
    headers: {
      ...(options.body !== undefined ? { 'content-type': 'application/json' } : {}),
      ...(options.cookie ? { cookie: options.cookie } : {}),
      ...(options.origin ? { origin: options.origin } : {}),
      ...vercelProtectionBypassHeaders(process.env.VERCEL_PROTECTION_BYPASS_SECRET),
      ...signRequest({ secret, method, url, body: options.body, timestamp: options.timestamp }),
    },
  };
}

export function sendSignedAuthRequest(request: SignedAuthRequest): Promise<Response> {
  return fetch(request.url, { method: request.method, headers: request.headers, body: request.body, cache: 'no-store' });
}
