'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Container, CardContent, CardHeader } from '@karasu-lab/ui';
import { SignUpForm } from '@/components/auth/sign-up-form';
import { useSdk } from '@/lib/auth/client';
import { getContinueTo } from '@/lib/redirect';

/** Sign-up page body — resolves the continuation target from the query string on the client. */
export function SignUpClient() {
  const searchParams = useSearchParams();
  const { config } = useSdk();
  const t = useTranslations();

  return (
    <Container className="max-w-sm">
      <CardHeader className="text-lg font-semibold">{t('signIn.createAccount')}</CardHeader>
      <CardContent className="space-y-6">
        <SignUpForm continueTo={getContinueTo(searchParams, config)} />
        <div className="flex justify-center">
          <Link href="/sign-in" className="text-sm font-medium text-primary hover:underline">
            {t('signIn.backToSignIn')}
          </Link>
        </div>
      </CardContent>
    </Container>
  );
}
