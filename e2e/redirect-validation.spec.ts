import { test, expect } from '@playwright/test';
import { resolveRedirectTo } from '../src/lib/redirect';
import { ACCOUNTS_URL } from '../playwright.config';
import { fillEmailPassword, signInPath, signUp } from './helpers';

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
  test(`sign-in falls back to accounts settings for ${untrusted}`, async ({ page, request }) => {
    const user = await signUp(request, 'untrusted');

    await page.goto(signInPath(untrusted));
    await fillEmailPassword(page, user);

    await page.waitForURL(`${ACCOUNTS_URL}/settings**`);
    expect(new URL(page.url()).origin).toBe(ACCOUNTS_URL);
  });
}
