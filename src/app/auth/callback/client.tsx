'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { LoadingView } from '@karasu-lab/ui';
import { useSdk } from '@/lib/auth/client';
import { getRedirectTo } from '@/lib/redirect';

/**
 * better-auth's own OAuth callback redirects here with the session cookie
 * already set (via `nextCookies()`), so this only confirms the session
 * actually landed — through the SDK's JWT exchange, not a session
 * lookup — before continuing to the redirect target validated against
 * the client configuration's trusted origins.
 *
 * On failure, redirects to /oauth/error.
 */
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
      window.location.replace(redirectTo);
    }

    completeSignIn().catch(() => window.location.replace('/oauth/error'));
  }, [redirectTo]);

  return <LoadingView message={t('oauthCallback.redirecting')} />;
}
