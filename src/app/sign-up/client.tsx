'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Container, CardContent, CardHeader } from '@karasu-lab/ui';
import { SignUpForm } from '@/components/auth/sign-up-form';

export function SignUpClient() {
  const t = useTranslations();
  const next = useSearchParams().get('next');

  return (
    <Container className="max-w-sm">
      <CardHeader className="text-lg font-semibold">{t('signIn.createAccount')}</CardHeader>
      <CardContent className="space-y-6">
        <SignUpForm next={next} />
        <div className="flex justify-center">
          <Link href="/sign-in" className="text-sm font-medium text-primary hover:underline">
            {t('signIn.backToSignIn')}
          </Link>
        </div>
      </CardContent>
    </Container>
  );
}
