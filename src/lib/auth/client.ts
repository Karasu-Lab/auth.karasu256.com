import { createAppAuthClient } from '@karasu-lab/utils/client';

export const { authClient, bridgeFirebaseSession } = createAppAuthClient({
  baseURL: process.env.NEXT_PUBLIC_AUTH_API_URL,
});
