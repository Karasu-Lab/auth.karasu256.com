'use client';

import { useSearchParams } from 'next/navigation';
import { ResetPasswordConfirmForm } from '@/components/auth/reset-password-confirm-form';

export function ResetPasswordConfirmClient() {
  const searchParams = useSearchParams();

  return <ResetPasswordConfirmForm token={searchParams.get('token') ?? ''} />;
}
