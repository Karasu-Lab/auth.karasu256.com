import { getRequestConfig } from 'next-intl/server';
import { defaultLocale } from './locales';

// Pages are prerendered as static assets, so the locale is not read from
// the request here; the client provider resolves it from the cookie.
export default getRequestConfig(async () => {
  return {
    locale: defaultLocale,
    messages: (await import(`../../messages/${defaultLocale}.json`)).default,
  };
});
