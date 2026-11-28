import { describe, expect, it } from 'vitest';
import { resolveSignInContinueMode, SIGN_IN_CONTINUE_PATH } from './sign-in-continue';

describe('resolveSignInContinueMode', () => {
  it('treats the preview app environment as a preview build', () => {
    expect(resolveSignInContinueMode('preview')).toBe('preview');
  });

  it('treats any other app environment as a production build', () => {
    expect(resolveSignInContinueMode('production')).toBe('production');
    expect(resolveSignInContinueMode('local')).toBe('production');
    expect(resolveSignInContinueMode(undefined)).toBe('production');
    expect(resolveSignInContinueMode('')).toBe('production');
  });

  it('points at the continue page of this app', () => {
    expect(SIGN_IN_CONTINUE_PATH).toBe('/sign-in/continue');
  });
});
