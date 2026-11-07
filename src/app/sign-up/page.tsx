import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { SignUpClient } from './client';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return { title: t('signIn.createAccount') };
}

/** Sign-up page, reached from the link button on the sign-in screen. */
export default function SignUpPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <Suspense>
        <SignUpClient />
      </Suspense>
    </main>
  );
}
