import { test, expect, type Page } from '@playwright/test';
import { ACCOUNTS_URL, AUTH_URL, MOCK_OAUTH_URL } from '../playwright.config';
import { configureMockOAuth, providerCallbackPattern, recordProviderStates, returnTarget, sessionEmail, signInPath, uniqueEmail } from './helpers';

test.afterEach(async ({ request }) => {
  await configureMockOAuth(request, 'redirect');
});

function trackAccountsVisits(page: Page): { visited: boolean } {
  const tracker = { visited: false };
  page.on('framenavigated', (frame) => {
    if (frame === page.mainFrame() && frame.url().startsWith(ACCOUNTS_URL)) tracker.visited = true;
  });
  return tracker;
}

async function expectRejected(page: Page, tracker: { visited: boolean }) {
  await page.waitForURL(`${AUTH_URL}/oauth/error**`);
  expect(tracker.visited).toBe(false);
  expect(await sessionEmail(page)).toBeNull();
}

test('rejects a state the provider tampered with', async ({ page, request }) => {
  await configureMockOAuth(request, 'tamper-state', uniqueEmail('tampered'));
  const tracker = trackAccountsVisits(page);

  await page.goto(signInPath(returnTarget()));
  await page.getByRole('button', { name: 'Google' }).click();

  await expectRejected(page, tracker);
});

test('rejects a callback whose state cookie is missing', async ({ page, request }) => {
  await configureMockOAuth(request, 'redirect', uniqueEmail('no-cookie'));
  let callbackUrl: string | null = null;
  await page.route(`${MOCK_OAUTH_URL}/google/authorize**`, async (route) => {
    const response = await route.fetch({ maxRedirects: 0 });
    callbackUrl = response.headers()['location'] ?? null;
    await route.abort();
  });

  await page.goto(signInPath(returnTarget()));
  await page.getByRole('button', { name: 'Google' }).click();
  await expect.poll(() => callbackUrl).not.toBeNull();
  expect(callbackUrl).toMatch(providerCallbackPattern('google'));

  await page.unrouteAll();
  await page.context().clearCookies();
  await page.goto('about:blank');
  const tracker = trackAccountsVisits(page);
  await page.goto(callbackUrl!);

  await expectRejected(page, tracker);
});

test('rejects a state that was already used', async ({ page, request }) => {
  await configureMockOAuth(request, 'redirect', uniqueEmail('reused'));
  const states = recordProviderStates(page, 'google');
  const target = returnTarget();

  await page.goto(signInPath(target));
  await page.getByRole('button', { name: 'Google' }).click();
  await page.waitForURL(target);
  expect(states.callbackUrl).toBeTruthy();

  await page.context().clearCookies();
  await page.goto('about:blank');
  const tracker = trackAccountsVisits(page);
  await page.goto(states.callbackUrl!);

  await expectRejected(page, tracker);
});
