import type { Metadata } from 'next';
import { config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages, getTranslations } from 'next-intl/server';
import './globals.css';
import { Toaster } from '@karasu-lab/ui';
import { geistSans, geistMono, notoSansJP } from '@karasu-lab/ui/fonts';
import { FeatureFlagsProvider } from '@karasu-lab/flags-sdk/server';
import { appFlags, appFlagsSchema } from '@/lib/flags';
import { SdkProvider } from '@/lib/auth/client';
import { getClientConfig } from '@/lib/auth/client-config';

config.autoAddCss = false;

// The root layout reads the deployment's configuration from the
// server's environment (see lib/auth/client-config) and hands it to
// the client tree, so every page renders per request from the
// server's current environment rather than from values baked in at
// build time.
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations('Metadata');
  const siteTitle = t('siteTitle');
  const siteDescription = t('siteDescription');

  return {
    metadataBase: new URL('https://auth.karasu256.com'),
    title: { default: siteTitle, template: '%s' },
    description: siteDescription,
    icons: {
      icon: '/icons/kara_su.png',
      shortcut: '/icons/kara_su.png',
      apple: '/icons/kara_su.png',
    },
    openGraph: {
      title: siteTitle,
      description: siteDescription,
      siteName: 'Karasu Lab',
      locale,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: siteTitle,
      description: siteDescription,
    },
  };
}

/** Root layout — applies Geist fonts and full-height flex column. */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className={`${geistSans.variable} ${geistMono.variable} ${notoSansJP.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-background text-foreground antialiased">
        <FeatureFlagsProvider flags={appFlags} schema={appFlagsSchema}>
          <NextIntlClientProvider messages={messages}>
            <SdkProvider config={getClientConfig()}>{children}</SdkProvider>
          </NextIntlClientProvider>
          <Toaster />
        </FeatureFlagsProvider>
      </body>
    </html>
  );
}
