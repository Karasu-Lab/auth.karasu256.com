import { z } from 'zod';

const TURNSTILE_SITE_KEY = '0x4AAAAAAFsX0TpFOyokXFPm';

interface ClientConfigDefaults {
  authApiUrl: string;
  authUrl: string;
  accountsUrl: string;
  appUrl: string;
  trustedOrigins: string[];
}

const PRODUCTION_DEFAULTS: ClientConfigDefaults = {
  authApiUrl: 'https://api-auth.karasu256.com',
  authUrl: 'https://auth.karasu256.com',
  accountsUrl: 'https://accounts.karasu256.com',
  appUrl: 'https://karasu256.com',
  trustedOrigins: ['https://accounts.karasu256.com', 'https://auth.karasu256.com', 'https://karasu256.com', 'https://qr.karasu256.com'],
};

const PREVIEW_DEFAULTS: ClientConfigDefaults = {
  authApiUrl: 'https://dev-api-auth.karasu256.com',
  authUrl: 'https://dev-auth.karasu256.com',
  accountsUrl: 'https://dev.accounts.karasu256.com',
  appUrl: 'https://dev.karasu256.com',
  trustedOrigins: [
    'https://dev.accounts.karasu256.com',
    'https://dev-auth.karasu256.com',
    'https://dev.karasu256.com',
    'https://dev.qr.karasu256.com',
  ],
};

const LOCAL_DEFAULTS: ClientConfigDefaults = {
  authApiUrl: 'http://localhost:8790',
  authUrl: 'http://localhost:3004',
  accountsUrl: 'http://localhost:3001',
  appUrl: 'http://localhost:3000',
  trustedOrigins: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3004',
    'https://local.karasu256.com',
    'https://local-accounts.karasu256.com',
    'https://local-qr.karasu256.com',
    'https://local-auth.karasu256.com',
  ],
};

function clientConfigSchema(defaults: ClientConfigDefaults) {
  return z.object({
    authApiUrl: z.url().default(defaults.authApiUrl),
    authUrl: z.url().default(defaults.authUrl),
    accountsUrl: z.url().default(defaults.accountsUrl),
    appUrl: z.url().default(defaults.appUrl),
    turnstileSiteKey: z.string().default(TURNSTILE_SITE_KEY),
    trustedOrigins: z.array(z.url()).default(defaults.trustedOrigins),
  });
}

export type ClientConfig = z.infer<ReturnType<typeof clientConfigSchema>>;

export function getClientConfig(): ClientConfig {
  const defaults = process.env.APP_ENV === 'preview' ? PREVIEW_DEFAULTS : process.env.APP_ENV === 'local' ? LOCAL_DEFAULTS : PRODUCTION_DEFAULTS;

  return clientConfigSchema(defaults).parse({
    authApiUrl: process.env.AUTH_API_URL,
    authUrl: process.env.AUTH_URL,
    accountsUrl: process.env.ACCOUNTS_URL,
    appUrl: process.env.APP_URL,
    turnstileSiteKey: process.env.TURNSTILE_SITE_KEY,
    trustedOrigins: process.env.TRUSTED_ORIGINS
      ? process.env.TRUSTED_ORIGINS.split(',')
          .map((origin) => origin.trim())
          .filter((origin) => origin.length > 0)
      : undefined,
  });
}
