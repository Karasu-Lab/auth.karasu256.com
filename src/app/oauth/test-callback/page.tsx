import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { TestCallbackClient } from './client';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return { title: t('oauth.testCallback.title') };
}

export default function TestCallbackPage() {
  return <TestCallbackClient />;
}
