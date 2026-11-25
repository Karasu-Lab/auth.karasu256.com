'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFingerprint } from '@fortawesome/free-solid-svg-icons';
import { useTranslations } from 'next-intl';
import { Spinner, toast } from '@karasu-lab/ui';
import { buildUriWithNext } from '@karasu-lab/sdk/uri';
import { useSdk } from '@/lib/auth/client';
import { isDeviceSessionConflict } from '@/lib/device-session-conflict';
import type { OAuthProvider } from '@/lib/oauth-providers';
import { ProviderIcon } from './provider-icon';

export interface ProviderButtonsProps {
  providers: OAuthProvider[];
  continueTo: string;
  onSignedIn: (redirectUrl?: string) => void;
  disabled?: boolean;
}

export function ProviderButtons({ providers, continueTo, onSignedIn, disabled = false }: ProviderButtonsProps) {
  const {
    sdk: { authClient },
  } = useSdk();
  const t = useTranslations();
  const [loading, setLoading] = useState<string | null>(null);

  async function handleSocial(provider: string) {
    setLoading(provider);
    const { error } = await authClient.signIn.social({
      provider,
      callbackURL: buildUriWithNext(`${window.location.origin}/auth/callback`, continueTo),
      errorCallbackURL: `${window.location.origin}/oauth/error`,
    });
    if (error) setLoading(null);
  }

  async function handlePasskey() {
    setLoading('passkey');
    const result = await authClient.signIn.passkey();
    if (result?.error) {
      toast.error(isDeviceSessionConflict(result.error) ? t('signIn.error.accountAlreadySignedIn') : (result.error.message ?? t('passkey.error.unknown')));
      setLoading(null);
      return;
    }
    const data = result?.data as { redirect?: boolean; url?: string } | null | undefined;
    onSignedIn(data?.redirect && data.url ? data.url : undefined);
  }

  const buttonClass =
    'flex h-11 w-11 items-center justify-center rounded-full ring-1 ring-foreground/15 transition-colors hover:bg-muted active:bg-foreground/10 disabled:opacity-50';

  return (
    <div className="flex items-center justify-center gap-3">
      {providers.map(({ id, label, iconUrl }) => (
        <button
          key={id}
          type="button"
          aria-label={label}
          title={label}
          className={buttonClass}
          disabled={disabled || loading !== null}
          onClick={() => void handleSocial(id)}
        >
          {loading === id ? <Spinner /> : <ProviderIcon iconUrl={iconUrl} className="h-5 w-5" />}
        </button>
      ))}
      <button
        type="button"
        aria-label={t('passkey.signIn')}
        title={t('passkey.signIn')}
        className={buttonClass}
        disabled={disabled || loading !== null}
        onClick={() => void handlePasskey()}
      >
        {loading === 'passkey' ? <Spinner /> : <FontAwesomeIcon icon={faFingerprint} className="h-5 w-5" />}
      </button>
    </div>
  );
}
