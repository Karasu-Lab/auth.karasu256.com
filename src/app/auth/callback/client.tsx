'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { LoadingView } from '@karasu-lab/ui';
import { useSdk } from '@/lib/auth/client';
import { generateOneTimeToken } from '@/lib/one-time-token';
import { completeNativeOAuthLink, getOAuthErrorUrl, getRedirectTo, isNativeOAuthCallback } from '@/lib/redirect';
import { SIGN_IN_CONTINUE_PATH } from '@/lib/sign-in-continue';

const APP_CALLBACK_PATH = '/auth/app/callback';

async function withOneTimeToken(redirectTo: string, authApiUrl: string): Promise<string> {
  const destination = new URL(redirectTo, window.location.origin);
  if (destination.pathname !== APP_CALLBACK_PATH) return redirectTo;

  const state = crypto.randomUUID();
  destination.searchParams.set('token', await generateOneTimeToken(authApiUrl, state));
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
      if (redirectTo && isNativeOAuthCallback(redirectTo)) {
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
        callback.searchParams.set('token', await generateOneTimeToken(config.authApiUrl, state));
        window.location.replace(callback.toString());
        return;
      }
      const data = await sdk.getSession();
      if (!data) {
        window.location.replace(getOAuthErrorUrl(incomingError ?? 'session_not_found'));
        return;
      }
      if (!redirectTo) {
        window.location.replace(SIGN_IN_CONTINUE_PATH);
        return;
      }
      window.location.replace(await withOneTimeToken(redirectTo, config.authApiUrl));
    }

    completeSignIn().catch((error: unknown) => {
      const raw = error instanceof Error ? error.message : typeof error === 'string' ? error : null;
      window.location.replace(getOAuthErrorUrl(raw ? raw : incomingError));
    });
  }, [flow, redirectTo]);

  return <LoadingView message={t('oauthCallback.redirecting')} />;
}
