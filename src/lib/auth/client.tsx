'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { LoadingView } from '@karasu-lab/ui';
import { createSdk, type SdkInstance } from '@karasu-lab/sdk/client';
import type { ClientConfig } from './client-config';

/**
 * The browser's view of the app: the SDK instance built from the
 * client configuration, and that configuration itself (for the values
 * components read directly, such as the Turnstile site key).
 */
export interface SdkContextValue {
  sdk: SdkInstance;
  config: ClientConfig;
}

const SdkContext = createContext<SdkContextValue | null>(null);

let clientConfigPromise: Promise<ClientConfig> | undefined;

function fetchClientConfig(): Promise<ClientConfig> {
  clientConfigPromise ??= fetch('/api/client-config').then(async (response) => {
    if (!response.ok) throw new Error(`Failed to load the client configuration (${response.status})`);
    return (await response.json()) as ClientConfig;
  });
  return clientConfigPromise;
}

/**
 * Loads the client configuration from `/api/client-config` (the server
 * resolves it from its own environment) and builds the SDK from it.
 * The SDK parses the hosts against its zod schema at this point, so a
 * deployment whose server environment is incomplete fails here instead
 * of drifting into a half-configured state.
 */
export function SdkProvider({ children }: { children: ReactNode }) {
  const t = useTranslations();
  const [value, setValue] = useState<SdkContextValue | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchClientConfig()
      .then((config) => setValue({ sdk: createSdk(config), config }))
      .catch((err: unknown) => setError(err instanceof Error ? err : new Error(String(err))));
  }, []);

  if (error) {
    return (
      <main className="flex flex-1 items-center justify-center p-4">
        <p className="text-sm text-destructive">{error.message}</p>
      </main>
    );
  }

  if (!value) {
    return (
      <main className="flex flex-1 items-center justify-center p-4">
        <LoadingView message={t('common.loading')} />
      </main>
    );
  }

  return <SdkContext.Provider value={value}>{children}</SdkContext.Provider>;
}

/** The SDK instance and client configuration provided by {@link SdkProvider}. */
export function useSdk(): SdkContextValue {
  const value = useContext(SdkContext);
  if (!value) throw new Error('useSdk must be used within an SdkProvider');
  return value;
}
