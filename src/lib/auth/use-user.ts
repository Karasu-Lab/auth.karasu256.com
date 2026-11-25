'use client';

import { useSdk } from '@/lib/auth/client';

export function useUser() {
  const {
    sdk: { authClient },
  } = useSdk();
  const { data, isPending } = authClient.useSession();

  return { user: data?.user ?? null, isPending };
}
