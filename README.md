# auth.karasu256.com

The sign-in, consent, password-reset, and sign-out pages of the monorepo's authentication system. It holds only a better-auth client (`authClient`) and UI: the better-auth server itself (sessions, email/password, Google/GitHub sign-in, passkeys, API key verification, and the OAuth 2.1/OIDC authorization server) runs in api-auth.karasu256.com, which this app calls through `NEXT_PUBLIC_AUTH_API_URL`.

It has no database of its own. Account management (`/settings`) stays in accounts.karasu256.com.

Run commands from the repository root, e.g. `pnpm --filter auth.karasu256.com dev` (port 3004).

## Deployment

Deployed as Cloudflare Workers by `.github/workflows/auth-deploy.yml`, which calls the shared `Karasu-Lab/WorkersDeploy` action. There are two separate workers:

- `auth-karasu256-com` serves production (`auth.karasu256.com`). Only pushes to `main` deploy it; per-branch Previews are not used.
- `dev-auth-karasu256-com` serves the preview environment on `dev-auth.karasu256.com` (the `dev` environment in `wrangler.jsonc`, selected with `CLOUDFLARE_ENV=dev`). Pushes to any other branch deploy it.

The variables (`APP_ENV`, `ACCOUNTS_URL`, `API_URL`, `APP_URL`, `AUTH_API_URL`, `TRUSTED_ORIGINS`, `TURNSTILE_SITE_KEY`) are not in `wrangler.jsonc`; they are injected from the `production` / `preview` GitHub Environment variables.

The workflow reads `CLOUDFLARE_API_TOKEN` (secret) and `CLOUDFLARE_ACCOUNT_ID` (variable) from the `production` / `preview` GitHub Environments.
