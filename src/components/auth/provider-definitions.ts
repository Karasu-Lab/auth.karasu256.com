import { faDiscord, faGithub, faGoogle, faMicrosoft, faXTwitter, faXbox } from '@fortawesome/free-brands-svg-icons';
import { faCube, faFlask } from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

export interface ProviderDefinition {
  id: string;
  label: string;
  icon: IconDefinition;
}

export const socialProviders: ProviderDefinition[] = [
  { id: 'google', label: 'Google', icon: faGoogle },
  { id: 'github', label: 'GitHub', icon: faGithub },
  { id: 'microsoft', label: 'Microsoft', icon: faMicrosoft },
  { id: 'twitter', label: 'X', icon: faXTwitter },
  { id: 'discord', label: 'Discord', icon: faDiscord },
];

export const derivedProviders: ProviderDefinition[] = [
  { id: 'xbox', label: 'Xbox', icon: faXbox },
  { id: 'minecraft', label: 'Minecraft', icon: faCube },
];

export const oauthTestProvider: ProviderDefinition = { id: 'oauth-test', label: 'OAuth Test', icon: faFlask };

export const providerDefinitions: ProviderDefinition[] = [...socialProviders, ...derivedProviders, oauthTestProvider];
