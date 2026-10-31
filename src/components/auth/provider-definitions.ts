import { faGithub, faGoogle } from '@fortawesome/free-brands-svg-icons';
import { faFlask } from '@fortawesome/free-solid-svg-icons';
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
 */
export const socialProviders: ProviderDefinition[] = [
  { id: 'google', label: 'Google', icon: faGoogle },
  { id: 'github', label: 'GitHub', icon: faGithub },
];

/** Provider definition used by OAuth authorization tests (see `src/app/oauth/test-callback`). */
export const oauthTestProvider: ProviderDefinition = { id: 'oauth-test', label: 'OAuth Test', icon: faFlask };
