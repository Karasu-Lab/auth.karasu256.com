'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { LoadingView } from '@karasu-lab/ui';
import { useSdk } from '@/lib/auth/client';
import { getRedirectTo } from '@/lib/redirect';

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

  useEffect(() => {
    async function completeSignIn() {
      const data = await sdk.getSession();
      if (!data) {
        window.location.replace('/oauth/error');
        return;
      }
      window.location.replace(await withOneTimeToken(redirectTo, config.authApiUrl));
    }

    completeSignIn().catch(() => window.location.replace('/oauth/error'));
  }, [redirectTo]);

  return <LoadingView message={t('oauthCallback.redirecting')} />;
}
