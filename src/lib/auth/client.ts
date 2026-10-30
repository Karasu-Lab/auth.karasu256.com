import { createSdk } from '@karasu-lab/sdk/client';

/**
 * The app's SDK instance, configured by injecting this deployment's
 * hosts. The SDK parses them against its zod host schema at startup,
 * and every auth and single sign-on call goes through this instance.
 */
export const sdk = createSdk({
  authApiUrl: process.env.NEXT_PUBLIC_AUTH_API_URL,
  authUrl: process.env.NEXT_PUBLIC_AUTH_URL,
  accountsUrl: process.env.NEXT_PUBLIC_ACCOUNTS_URL,
  appUrl: process.env.NEXT_PUBLIC_APP_URL,
});

export const { authClient, bridgeFirebaseSession } = sdk;
