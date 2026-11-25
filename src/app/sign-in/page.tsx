import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { fetchSignInProviders } from '@/lib/oauth-providers';
import { SignInClient } from './client';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Metadata');
  return { title: t('signIn.title') };
}

export default async function SignInPage() {
  const providers = await fetchSignInProviders();
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <Suspense>
        <SignInClient providers={providers} />
      </Suspense>
    </main>
  );
}
