# auth.karasu256.com

The monorepo's authentication and authorization server. It hosts the single better-auth instance (sessions, email/password, Google/GitHub sign-in, passkeys, API key verification, and the OAuth 2.1/OIDC authorization server) plus the sign-in, consent, password-reset, and sign-out pages.

It has no database of its own: it connects to the same Postgres database as accounts.karasu256.com, which owns the Drizzle migrations. Account management (`/settings`) stays in accounts.karasu256.com.

Run commands from the repository root, e.g. `pnpm --filter auth.karasu256.com dev` (port 3004).
