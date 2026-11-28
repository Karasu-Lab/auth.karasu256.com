export const SIGN_IN_CONTINUE_PATH = '/sign-in/continue';

export type SignInContinueMode = 'production' | 'preview';

export function resolveSignInContinueMode(appEnv: string | undefined): SignInContinueMode {
  return appEnv === 'preview' ? 'preview' : 'production';
}
