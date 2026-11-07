'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { LoadingView } from '@karasu-lab/ui';
import { useSdk } from '@/lib/auth/client';
import { getRedirectTo } from '@/lib/redirect';

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
