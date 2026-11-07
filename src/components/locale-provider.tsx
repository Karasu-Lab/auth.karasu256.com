'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { NextIntlClientProvider, type AbstractIntlMessages } from 'next-intl';
import { locales, defaultLocale, type Locale } from '@/i18n/locales';
import jaMessages from '../../messages/ja.json';
import enMessages from '../../messages/en.json';
import cnMessages from '../../messages/cn.json';

const messagesByLocale: Record<Locale, AbstractIntlMessages> = {
  ja: jaMessages,
  en: enMessages,
  cn: cnMessages,
};

function readCookieLocale(): Locale {
  const cookieLocale = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith('NEXT_LOCALE='))
    ?.slice('NEXT_LOCALE='.length);
  return locales.includes(cookieLocale as Locale) ? (cookieLocale as Locale) : defaultLocale;
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(defaultLocale);

  useEffect(() => {
    const cookieLocale = readCookieLocale();
    if (cookieLocale !== defaultLocale) {
      setLocale(cookieLocale);
      document.documentElement.lang = cookieLocale;
    }
  }, []);

  return (
    <NextIntlClientProvider locale={locale} messages={messagesByLocale[locale]}>
      {children}
    </NextIntlClientProvider>
  );
}
