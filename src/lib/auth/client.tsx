'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { createSdk, type SdkInstance } from '@karasu-lab/sdk/client';
import type { ClientConfig } from './client-config';

/**
 * The browser's view of the app: the SDK instance built from the
 * server-provided configuration, and that configuration itself (for
 * the values components read directly, such as the Turnstile site
 * key). Provided by {@link SdkProvider} in the root layout.
 */
export interface SdkContextValue {
  sdk: SdkInstance;
  config: ClientConfig;
}

const SdkContext = createContext<SdkContextValue | null>(null);

/**
 * Builds the SDK from the configuration the server read from its own
 * environment and hands it to the client tree. The SDK parses the
 * hosts against its zod schema at this point, so a deployment whose
 * server environment is incomplete fails on first render instead of
 * drifting into a half-configured state.
 */
export function SdkProvider({ config, children }: { config: ClientConfig; children: ReactNode }) {
  const value = useMemo<SdkContextValue>(() => ({ sdk: createSdk(config), config }), [config]);
  return <SdkContext.Provider value={value}>{children}</SdkContext.Provider>;
}

/** The SDK instance and client configuration provided by {@link SdkProvider}. */
export function useSdk(): SdkContextValue {
  const value = useContext(SdkContext);
  if (!value) throw new Error('useSdk must be used within an SdkProvider');
  return value;
}
