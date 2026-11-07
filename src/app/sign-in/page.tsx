import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { SignInClient } from './client';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Metadata');
  return { title: t('signIn.title') };
}

export default function SignInPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <Suspense>
        <SignInClient />
      </Suspense>
    </main>
  );
}
