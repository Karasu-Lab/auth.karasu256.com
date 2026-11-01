/**
 * The configuration the server hands to the browser: the hosts the
 * SDK is built against and the Turnstile site key. The host fields
 * carry the same names as the SDK's host configuration input.
 *
 * The server's environment variables are the single source of truth
 * for these values. They are read here, on the server, from the plain
 * (non-`NEXT_PUBLIC_`) variables the deployment provides, and reach
 * the client only as the props of the root layout's provider — the
 * client bundle carries no environment variables of its own, so there
 * is no second, build-time copy that can drift or go missing.
 */
export interface ClientConfig {
  authApiUrl?: string;
  authUrl?: string;
  accountsUrl?: string;
  appUrl?: string;
  /** Cloudflare Turnstile site key for the bot-verification widgets. */
  turnstileSiteKey?: string;
}

/** Reads the client configuration from the server's environment. Server-side only. */
export function getClientConfig(): ClientConfig {
  return {
    authApiUrl: process.env.AUTH_API_URL,
    authUrl: process.env.AUTH_URL,
    accountsUrl: process.env.ACCOUNTS_URL,
    appUrl: process.env.APP_URL,
    turnstileSiteKey: process.env.TURNSTILE_SITE_KEY,
  };
}
