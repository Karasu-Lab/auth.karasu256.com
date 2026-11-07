'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { createSdk, type SdkInstance } from '@karasu-lab/sdk/client';
import type { ClientConfig } from './client-config';

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

export function SdkProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState<SdkContextValue | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchClientConfig()
      .then((config) => setValue({ sdk: createSdk(config), config }))
      .catch((err: unknown) => setError(err instanceof Error ? err : new Error(String(err))));
  }, []);

  if (error) throw error;

  if (!value) return null;

  return <SdkContext.Provider value={value}>{children}</SdkContext.Provider>;
}

export function useSdk(): SdkContextValue {
  const value = useContext(SdkContext);
  if (!value) throw new Error('useSdk must be used within an SdkProvider');
  return value;
}
