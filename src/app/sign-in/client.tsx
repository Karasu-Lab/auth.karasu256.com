'use client';

import { useSearchParams } from 'next/navigation';
import { SignInFlow } from '@/components/auth/sign-in-flow';
import { useSdk } from '@/lib/auth/client';
import { getContinueTo } from '@/lib/redirect';

/** Sign-in page body — resolves the continuation target from the query string on the client. */
export function SignInClient() {
  const searchParams = useSearchParams();
  const { config } = useSdk();

  return <SignInFlow continueTo={getContinueTo(searchParams, config)} forceLogin={searchParams.get('prompt') === 'login'} />;
}
