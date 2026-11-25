import { z } from 'zod';

const clientConfigEnvSchema = z.object({
  AUTH_API_URL: z.url(),
  AUTH_URL: z.url().optional(),
  ACCOUNTS_URL: z.url(),
  APP_URL: z.url(),
  APP_ENV: z.string().optional(),
  TURNSTILE_SITE_KEY: z.string().optional(),
  TRUSTED_ORIGINS: z
    .string()
    .optional()
    .transform((value) =>
      (value ?? '')
        .split(',')
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0)
    )
    .pipe(z.array(z.url())),
});

export interface ClientConfig {
  authApiUrl: string;
  authUrl?: string;
  accountsUrl: string;
  appUrl: string;
  appEnv?: string;
  turnstileSiteKey: string;
  trustedOrigins: string[];
}

export function getClientConfig(): ClientConfig {
  const env = clientConfigEnvSchema.parse(process.env);
  if (env.APP_ENV !== 'preview' && env.TRUSTED_ORIGINS.length === 0) throw new Error('TRUSTED_ORIGINS is not set');
  return {
    appEnv: env.APP_ENV,
    authApiUrl: env.AUTH_API_URL,
    authUrl: env.AUTH_URL,
    accountsUrl: env.ACCOUNTS_URL,
    appUrl: env.APP_URL,
    turnstileSiteKey: env.APP_ENV === 'local' || env.APP_ENV === 'preview' ? '' : (env.TURNSTILE_SITE_KEY ?? ''),
    trustedOrigins: env.TRUSTED_ORIGINS,
  };
}
