# auth.karasu256.com

The sign-in, consent, password-reset, and sign-out pages of the monorepo's authentication system. It holds only a better-auth client (`authClient`) and UI: the better-auth server itself (sessions, email/password, Google/GitHub sign-in, passkeys, API key verification, and the OAuth 2.1/OIDC authorization server) runs in api-auth.karasu256.com, which this app calls through `NEXT_PUBLIC_AUTH_API_URL`.

It has no database of its own. Account management (`/settings`) stays in accounts.karasu256.com.

Run commands from the repository root, e.g. `pnpm --filter auth.karasu256.com dev` (port 3004).

## Deployment

Deployed as a Cloudflare Worker by `.github/workflows/auth-deploy.yml`, a thin wrapper around the shared [`deploy-worker`](https://github.com/Karasu-Lab/Workers) action (`Karasu-Lab/Workers/deploy-worker@v1`): pushes to `main` deploy production, other branches deploy a per-branch Preview (only the newest five Previews are kept). No custom domain is attached yet; the worker serves on its workers.dev subdomain. The workflow reads `CLOUDFLARE_API_TOKEN` (secret) and `CLOUDFLARE_ACCOUNT_ID` (variable) from the `production` / `preview` GitHub Environments.
