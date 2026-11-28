import { test, expect } from '@playwright/test';
import { resolveRedirectTo } from '../src/lib/redirect';
import { AUTH_URL } from '../playwright.config';
import { fillEmailPassword, sessionEmail, signInPath, signUp } from './helpers';

const trusted = ['https://accounts.karasu256.com', 'https://karasu256.com'];
const fallback = 'https://accounts.karasu256.com/settings';

test.describe('resolveRedirectTo', () => {
  test('keeps a trusted origin with its path and query', () => {
    expect(resolveRedirectTo('https://karasu256.com/settings?tab=1', trusted, fallback)).toBe('https://karasu256.com/settings?tab=1');
  });

  test('keeps a relative path', () => {
    expect(resolveRedirectTo('/oauth/consent?x=1', trusted, fallback)).toBe('/oauth/consent?x=1');
  });

  for (const raw of [
    'https://evil.example/steal',
    '//evil.example',
    '/\\evil.example',
    'javascript:alert(1)',
    'https://karasu256.com.evil.example',
    'not a url',
    '',
    null,
  ]) {
    test(`falls back for ${JSON.stringify(raw)}`, () => {
      expect(resolveRedirectTo(raw, trusted, fallback)).toBe(fallback);
    });
  }
});

for (const untrusted of ['https://evil.example/steal', '//evil.example']) {
  test(`sign-in does not redirect for ${untrusted}`, async ({ page, request }) => {
    const user = await signUp(request, 'untrusted');

    await page.goto(signInPath(untrusted));
    await fillEmailPassword(page, user);

    await expect.poll(() => sessionEmail(page)).toBe(user.email);
    expect(new URL(page.url()).origin).toBe(AUTH_URL);
    expect(new URL(page.url()).pathname).toBe('/sign-in');
  });
}

test('sign-in does not redirect when no destination is given', async ({ page, request }) => {
  const user = await signUp(request, 'no-next');

  await page.goto('/sign-in');
  await fillEmailPassword(page, user);

  await expect.poll(() => sessionEmail(page)).toBe(user.email);
  expect(new URL(page.url()).origin).toBe(AUTH_URL);
  expect(new URL(page.url()).pathname).toBe('/sign-in');
});
