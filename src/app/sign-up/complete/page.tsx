import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { SignUpCompleteClient } from './client';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return { title: t('signUpComplete.title') };
}

export default function SignUpCompletePage() {
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <SignUpCompleteClient />
    </main>
  );
}
