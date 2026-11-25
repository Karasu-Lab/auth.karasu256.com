import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { CardContent, CardHeader, Container } from '@karasu-lab/ui';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return { title: t('signUpComplete.title') };
}

export default async function SignUpCompletePage() {
  const t = await getTranslations();

  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <Container className="max-w-sm">
        <CardHeader className="text-lg font-semibold">{t('signUpComplete.title')}</CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t('signUpComplete.message')}</p>
        </CardContent>
      </Container>
    </main>
  );
}
