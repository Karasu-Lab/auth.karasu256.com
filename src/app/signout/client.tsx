'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { LoadingView } from '@karasu-lab/ui';
import { useSdk } from '@/lib/auth/client';
import { resolveRedirectTo } from '@/lib/redirect';

/** Clears the better-auth session, then navigates to the `?next` URL validated against the trusted origins. */
export function SignOutClient() {
  const searchParams = useSearchParams();
  const {
    sdk: { authClient },
    config,
  } = useSdk();
  const t = useTranslations();
  const next = resolveRedirectTo(searchParams.get('next'), config.trustedOrigins, '/sign-in');

  useEffect(() => {
    async function performSignOut() {
      try {
        await authClient.signOut();
      } finally {
        window.location.replace(next);
      }
    }
    performSignOut();
  }, [next]);

  return <LoadingView message={t('settings.signingOut')} />;
}
