import { test, expect } from '@playwright/test';
import { ACCOUNTS_URL } from '../playwright.config';
import { signInPath } from './helpers';

test('creates an account from the sign-up form', async ({ page }) => {
  const email = `e2e-sign-up-${Date.now()}@example.test`;
  const password = `pw-${crypto.randomUUID()}`;

  const target = `${ACCOUNTS_URL}/settings/profile`;
  await page.goto(signInPath(target));
  await page.getByRole('tab', { name: 'アカウント作成' }).click();
  await page.getByRole('textbox', { name: 'メールアドレス' }).fill(email);
  await page.getByLabel('パスワード', { exact: true }).fill(password);
  await page.getByRole('checkbox').first().click();
  await page.getByRole('button', { name: 'アカウント作成', exact: true }).click();
  await page.waitForURL('**/sign-up/complete');
  await expect(page.getByText('アカウントを作成しました').first()).toBeVisible();
});
