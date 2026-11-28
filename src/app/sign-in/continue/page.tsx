import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { SignInContinueClient } from './client';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return { title: t('signInContinue.title') };
}

export default function SignInContinuePage() {
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <SignInContinueClient />
    </main>
  );
}
