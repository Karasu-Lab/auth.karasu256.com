import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { CardContent, CardHeader, Container } from '@karasu-lab/ui';
import { getClientConfig } from '@/lib/auth/client-config';
import { getTrustedOrigins, resolveRedirectTo } from '@/lib/redirect';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return { title: t('emailVerifyComplete.title') };
}

export default async function EmailVerifyCompletePage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const t = await getTranslations();
  const { next, error } = await searchParams;
  if (error) {
    const params = new URLSearchParams({ error });
    if (next) params.set('next', next);
    redirect(`/email/verify/error?${params.toString()}`);
  }
  const config = getClientConfig();
  const continueTo = resolveRedirectTo(next, getTrustedOrigins(config), '');

  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <Container className="max-w-sm">
        <CardHeader className="text-lg font-semibold">{t('emailVerifyComplete.title')}</CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{t('emailVerifyComplete.message')}</p>
          {continueTo && (
            <a
              href={continueTo}
              className="inline-flex h-8 w-full items-center justify-center rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground"
            >
              {t('emailVerifyComplete.continue')}
            </a>
          )}
        </CardContent>
      </Container>
    </main>
  );
}
