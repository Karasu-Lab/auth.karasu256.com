import { z } from 'zod';

const clientConfigEnvSchema = z.object({
  AUTH_API_URL: z.url(),
  AUTH_URL: z.url().optional(),
  ACCOUNTS_URL: z.url(),
  APP_URL: z.url(),
  TURNSTILE_SITE_KEY: z.string().min(1),
  TRUSTED_ORIGINS: z
    .string()
    .min(1)
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0)
    )
    .pipe(z.array(z.url()).min(1)),
});

export interface ClientConfig {
  authApiUrl: string;
  authUrl?: string;
  accountsUrl: string;
  appUrl: string;
  turnstileSiteKey: string;
  trustedOrigins: string[];
}

export function getClientConfig(): ClientConfig {
  const env = clientConfigEnvSchema.parse(process.env);
  return {
    authApiUrl: env.AUTH_API_URL,
    authUrl: env.AUTH_URL,
    accountsUrl: env.ACCOUNTS_URL,
    appUrl: env.APP_URL,
    turnstileSiteKey: env.TURNSTILE_SITE_KEY,
    trustedOrigins: env.TRUSTED_ORIGINS,
  };
}
