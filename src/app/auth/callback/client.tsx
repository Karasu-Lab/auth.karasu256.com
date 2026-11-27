'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { LoadingView } from '@karasu-lab/ui';
import { useSdk } from '@/lib/auth/client';
import { completeNativeOAuthLink, getOAuthErrorUrl, getRedirectTo, isNativeOAuthCallback } from '@/lib/redirect';

const APP_CALLBACK_PATH = '/auth/app/callback';

async function withOneTimeToken(redirectTo: string, authApiUrl: string): Promise<string> {
  const destination = new URL(redirectTo, window.location.origin);
  if (destination.pathname !== APP_CALLBACK_PATH) return redirectTo;

  const state = crypto.randomUUID();
  const response = await fetch(`${authApiUrl.replace(/\/+$/, '')}/api/auth/one-time-token/generate?state=${state}`, { credentials: 'include' });
  if (!response.ok) throw new Error('one_time_token_failed');
  destination.searchParams.set('token', ((await response.json()) as { token: string }).token);
  destination.searchParams.set('state', state);
  return destination.toString();
}

export function OAuthCallbackClient() {
  const searchParams = useSearchParams();
  const { sdk, config } = useSdk();
  const t = useTranslations();
  const redirectTo = getRedirectTo(searchParams.get('next'), config);
  const flow = searchParams.get('flow');
  const incomingError = searchParams.get('error');

  useEffect(() => {
    async function completeSignIn() {
      if (isNativeOAuthCallback(redirectTo)) {
        const callback = new URL(redirectTo);
        const state = callback.searchParams.get('state');
        if (!state || !/^[A-Za-z0-9_-]{16,128}$/.test(state)) {
          window.location.replace(getOAuthErrorUrl(incomingError ?? 'invalid_state'));
          return;
        }
        if (flow === 'link') {
          const error = searchParams.get('error');
          if (error) {
            if (searchParams.has('error_description')) {
              callback.searchParams.set('error_description', searchParams.get('error_description') ?? '');
            }
            callback.searchParams.set('error', error);
            window.location.replace(callback.toString());
            return;
          }
          const linkCallback = completeNativeOAuthLink(redirectTo);
          if (!linkCallback) {
            window.location.replace(getOAuthErrorUrl(incomingError ?? 'invalid_state'));
            return;
          }
          window.location.replace(linkCallback);
          return;
        }
        const data = await sdk.getSession();
        if (!data) {
          window.location.replace(getOAuthErrorUrl(incomingError ?? 'session_not_found'));
          return;
        }
        const response = await fetch(
          `${config.authApiUrl}/api/auth/one-time-token/generate?state=${encodeURIComponent(state)}`,
          { method: 'POST', credentials: 'include' },
        );
        if (!response.ok) {
          window.location.replace(getOAuthErrorUrl('one_time_token_failed'));
          return;
        }
        const body = (await response.json()) as { token?: string };
        if (!body.token) {
          window.location.replace(getOAuthErrorUrl('one_time_token_failed'));
          return;
        }
        callback.searchParams.set('token', body.token);
        window.location.replace(callback.toString());
        return;
      }
      const data = await sdk.getSession();
      if (!data) {
        window.location.replace(getOAuthErrorUrl(incomingError ?? 'session_not_found'));
        return;
      }
      window.location.replace(await withOneTimeToken(redirectTo, config.authApiUrl));
    }

    completeSignIn().catch((error: unknown) =>
      window.location.replace(
        getOAuthErrorUrl(error instanceof Error && /^[a-z][a-z0-9_]*$/.test(error.message) ? error.message : (incomingError ?? 'unknown_error')),
      ),
    );
  }, [flow, redirectTo]);

  return <LoadingView message={t('oauthCallback.redirecting')} />;
}
