'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFingerprint } from '@fortawesome/free-solid-svg-icons';
import { useTranslations } from 'next-intl';
import { toast } from '@Hashibutogarasu/ui';
import { authClient } from '@/lib/auth/client';
import { Button, Spinner } from '@Hashibutogarasu/ui';

export interface PasskeySectionProps {
  /** Called after a successful sign-in, with the URL better-auth asked to continue to, if any. */
  onSuccess: (redirectUrl?: string) => void;
  /** Disables the button, e.g. while the caller's session state hasn't loaded yet. Defaults to `false`. */
  disabled?: boolean;
}

/** Renders the passkey sign-in button for unauthenticated users. */
export function PasskeySection({ onSuccess, disabled = false }: PasskeySectionProps) {
  const t = useTranslations();
  const [loading, setLoading] = useState(false);

  /**
   * Checks the returned `error` directly rather than `fetchOptions.onError`,
   * since WebAuthn cancellation surfaces there but not always through that
   * callback (which only fires for server-side failures).
   */
  async function handleSignIn() {
    setLoading(true);
    const result = await authClient.signIn.passkey();
    if (result?.error) {
      toast.error(result.error.message ?? t('passkey.error.unknown'));
      setLoading(false);
      return;
    }
    const data = result?.data as { redirect?: boolean; url?: string } | null | undefined;
    onSuccess(data?.redirect && data.url ? data.url : undefined);
  }

  return (
    <Button variant="outline" className="w-full" onClick={handleSignIn} disabled={disabled || loading}>
      {loading ? <Spinner /> : <FontAwesomeIcon icon={faFingerprint} />}
      {loading ? t('passkey.waiting') : t('passkey.signIn')}
    </Button>
  );
}
