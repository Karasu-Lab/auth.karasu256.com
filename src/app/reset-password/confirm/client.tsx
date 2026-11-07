'use client';

import { useSearchParams } from 'next/navigation';
import { ResetPasswordConfirmForm } from '@/components/auth/reset-password-confirm-form';

/** Reads the one-time reset token from the query string on the client. */
export function ResetPasswordConfirmClient() {
  const searchParams = useSearchParams();

  return <ResetPasswordConfirmForm token={searchParams.get('token') ?? ''} />;
}
