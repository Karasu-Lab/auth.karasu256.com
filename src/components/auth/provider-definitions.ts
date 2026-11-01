import { faGithub, faGoogle, faMicrosoft, faXbox } from '@fortawesome/free-brands-svg-icons';
import { faCube, faFlask } from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

export interface ProviderDefinition {
  id: string;
  label: string;
  icon: IconDefinition;
}

/**
 * The social provider definitions, owned by this app: the sign-in
 * provider buttons render these, and the accounts app's linking screen
 * overrides its `providers` property with the same set. The OAuth test
 * provider below is part of the definition but is for authorization
 * tests only — it is not part of the social set, so neither sign-in nor
 * the linking screen ever renders it.
 *
 * Microsoft sign-in doubles as the credential for the derived
 * providers below: api-auth exchanges the linked Microsoft account's
 * refresh token for an XboxLive.signin-scoped token, so the same link
 * backs Xbox Live authentication and the Minecraft account connection.
 */
export const socialProviders: ProviderDefinition[] = [
  { id: 'google', label: 'Google', icon: faGoogle },
  { id: 'github', label: 'GitHub', icon: faGithub },
  { id: 'microsoft', label: 'Microsoft', icon: faMicrosoft },
];

/**
 * Providers derived from the linked Microsoft account, registered on
 * the user endpoint (`/api/users/me/providers/[providerId]/details`)
 * next to the social providers. They have no OAuth flow or sign-in
 * button of their own: a profile resolves for them exactly when the
 * Microsoft link is present and the Xbox Live chain succeeds — for
 * Minecraft, only when the account owns the game. The linking screen
 * shows the Minecraft entry; its link and unlink actions act on the
 * Microsoft link underneath.
 */
export const derivedProviders: ProviderDefinition[] = [
  { id: 'xbox', label: 'Xbox', icon: faXbox },
  { id: 'minecraft', label: 'Minecraft', icon: faCube },
];

/** Provider definition used by OAuth authorization tests (see `src/app/oauth/test-callback`). */
export const oauthTestProvider: ProviderDefinition = { id: 'oauth-test', label: 'OAuth Test', icon: faFlask };
