export interface ClientConfig {
  authApiUrl?: string;
  authUrl?: string;
  accountsUrl?: string;
  appUrl?: string;
  cdnUrl?: string;
  turnstileSiteKey?: string;
}

export function getClientConfig(): ClientConfig {
  return {
    authApiUrl: process.env.AUTH_API_URL,
    authUrl: process.env.AUTH_URL,
    accountsUrl: process.env.ACCOUNTS_URL,
    appUrl: process.env.APP_URL,
    cdnUrl: process.env.CDN_URL,
    turnstileSiteKey: process.env.TURNSTILE_SITE_KEY,
  };
}
