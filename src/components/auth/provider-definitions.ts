import { faXbox } from '@fortawesome/free-brands-svg-icons';
import { faCube, faFlask } from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

export interface ProviderDefinition {
  id: string;
  label: string;
  icon: IconDefinition;
}

// Providers resolved from the Xbox link flow in
// Karasu-Lab/api-auth.karasu256.com, not from a sign-in provider.
export const derivedProviders: ProviderDefinition[] = [
  { id: 'xbox', label: 'Xbox', icon: faXbox },
  { id: 'minecraft', label: 'Minecraft', icon: faCube },
];

/** Provider definition used by OAuth authorization tests (see `src/app/oauth/test-callback`). */
export const oauthTestProvider: ProviderDefinition = { id: 'oauth-test', label: 'OAuth Test', icon: faFlask };
