import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { CardContent, CardHeader, Container } from '@karasu-lab/ui';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return { title: t('emailVerifyError.title') };
}

export default async function EmailVerifyErrorPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const t = await getTranslations();
  const { error, next } = await searchParams;
  const expired = error?.toLowerCase() === 'token_expired';

  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <Container className="max-w-sm">
        <CardHeader className="text-lg font-semibold">{t('emailVerifyError.title')}</CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{expired ? t('emailVerifyError.expired') : t('emailVerifyError.invalid')}</p>
          <Link
            href={next ? `/sign-up?next=${encodeURIComponent(next)}` : '/sign-up'}
            className="inline-flex h-8 w-full items-center justify-center rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground"
          >
            {t('emailVerifyError.retry')}
          </Link>
        </CardContent>
      </Container>
    </main>
  );
}
