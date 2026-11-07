'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { LoadingView } from '@karasu-lab/ui';

/** Sends the visitor to the sign-in page, keeping the query string as received. */
export function RootRedirectClient() {
  const t = useTranslations();

  useEffect(() => {
    window.location.replace(`/sign-in${window.location.search}`);
  }, []);

  return <LoadingView message={t('oauthCallback.redirecting')} />;
}
