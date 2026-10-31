import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ConsentClient } from './client';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return { title: t('oauthConsent.title') };
}

/** Consent screen for the OAuth provider's `/oauth2/authorize` flow — see api-auth's `oauthProvider` `consentPage` option. */
export default function ConsentPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <ConsentClient />
    </main>
  );
}
