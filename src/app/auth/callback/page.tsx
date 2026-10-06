import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { getRedirectTo } from '@/lib/redirect-server';
import { OAuthCallbackClient } from './client';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Metadata');
  return { title: t('authCallback.title') };
}

interface Props {
  searchParams: Promise<{ redirectTo?: string | string[] }>;
}

/** Intermediate page shown during the OAuth sign-in redirect flow. */
export default async function OAuthCallbackPage({ searchParams }: Props) {
  const { redirectTo } = await searchParams;
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <OAuthCallbackClient redirectTo={getRedirectTo(redirectTo)} />
    </main>
  );
}
