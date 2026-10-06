'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { LoadingView } from '@Hashibutogarasu/ui';
import { authClient } from '@/lib/auth/client';

export interface OAuthCallbackClientProps {
  redirectTo: string;
}

/**
 * better-auth's own OAuth callback redirects here with the session cookie
 * already set (via `nextCookies()`), so this only confirms the session
 * actually landed before continuing to the already-validated `redirectTo`.
 *
 * On failure, redirects to /oauth/error.
 */
export function OAuthCallbackClient({ redirectTo }: OAuthCallbackClientProps) {
  const t = useTranslations();

  useEffect(() => {
    async function completeSignIn() {
      const { data } = await authClient.getSession();
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
