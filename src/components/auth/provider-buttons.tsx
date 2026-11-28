'use client';

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { useTranslations } from 'next-intl';
import { Spinner, toast } from '@karasu-lab/ui';
import { buildUriWithNext } from '@karasu-lab/sdk/uri';
import { useSdk } from '@/lib/auth/client';
import { isDeviceSessionConflict } from '@/lib/device-session-conflict';
import type { OAuthProvider } from '@/lib/oauth-providers';
import { ProviderIcon } from './provider-icon';

export interface ProviderButtonsProps {
  providers: OAuthProvider[];
  continueTo: string | null;
  onSignedIn: (redirectUrl?: string) => void;
  autoStartProvider?: string;
  disabled?: boolean;
}

export function ProviderButtons({ providers, continueTo, onSignedIn, autoStartProvider, disabled = false }: ProviderButtonsProps) {
  const {
    sdk: { authClient },
  } = useSdk();
  const t = useTranslations();
  const [loading, setLoading] = useState<string | null>(null);
  const autoStarted = useRef(false);

  const handleSocial = useCallback(async (provider: string) => {
    setLoading(provider);
    const { error } = await authClient.signIn.social({
      provider,
      callbackURL: continueTo ? buildUriWithNext(`${window.location.origin}/auth/callback`, continueTo) : `${window.location.origin}/auth/callback`,
      errorCallbackURL: `${window.location.origin}/oauth/error`,
    });
    if (error) setLoading(null);
  }, [authClient, continueTo]);

  useEffect(() => {
    if (autoStarted.current || disabled || !autoStartProvider) return;
    if (!providers.some((provider) => provider.id === autoStartProvider && provider.kind === 'social')) return;
    autoStarted.current = true;
    void handleSocial(autoStartProvider);
  }, [autoStartProvider, disabled, handleSocial, providers]);

  async function handlePasskey(id: string) {
    setLoading(id);
    const result = await authClient.signIn.passkey();
    if (result?.error) {
      toast.error(isDeviceSessionConflict(result.error) ? t('signIn.error.accountAlreadySignedIn') : (result.error.message ?? t('passkey.error.unknown')));
      setLoading(null);
      return;
    }
    const data = result?.data as { redirect?: boolean; url?: string } | null | undefined;
    onSignedIn(data?.redirect && data.url ? data.url : undefined);
  }

  const signInHandlers: Partial<Record<OAuthProvider['kind'], (id: string) => Promise<void>>> = {
    social: handleSocial,
    passkey: handlePasskey,
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {providers.map(({ id, kind, label, iconUrl, backgroundColor, foregroundColor }) => (
        <button
          key={id}
          type="button"
          aria-label={label}
          title={label}
          className="flex aspect-square w-[calc((100%-3rem)/5)] max-w-11 shrink-0 items-center justify-center rounded-full bg-(--provider-background) ring-1 ring-foreground/15 transition-opacity hover:opacity-90 active:opacity-80 disabled:opacity-50 dark:bg-(--provider-background-dark)"
          style={
            {
              '--provider-background': backgroundColor.default,
              '--provider-background-dark': backgroundColor.dark,
            } as CSSProperties
          }
          disabled={disabled || loading !== null}
          onClick={() => void signInHandlers[kind]?.(id)}
        >
          {loading === id ? <Spinner /> : <ProviderIcon iconUrl={iconUrl} className="aspect-square w-1/2" color={foregroundColor} />}
        </button>
      ))}
    </div>
  );
}
