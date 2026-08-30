import { expect, test } from '@playwright/test';

const testUser = {
  id: 'password-user',
  aud: 'authenticated',
  email: 'traveler@example.com',
  app_metadata: {},
  user_metadata: {},
  created_at: '2026-08-31T00:00:00.000Z',
};

test('redirects a signed-out visitor from travel pages to login', async ({
  page,
}) => {
  await page.goto('/itinerary');
  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByRole('heading', { name: '登录 TripFlow' }),
  ).toBeVisible();
});

test('logs in with email and password', async ({ page }) => {
  await page.route('**/rest/v1/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '[]',
    });
  });
  await page.route('**/auth/v1/token**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: 'password-access-token',
        refresh_token: 'password-refresh-token',
        expires_in: 3600,
        token_type: 'bearer',
        user: testUser,
      }),
    });
  });

  await page.goto('/login');
  await page.getByLabel('邮箱地址').fill('traveler@example.com');
  await page.getByLabel('密码').fill('password123');
  await page.getByRole('button', { name: '登录 TripFlow' }).click();

  await expect(page).toHaveURL(/\/trips$/);
  await expect(page.getByRole('heading', { name: '我的旅行' })).toBeVisible();
});

test('shows email verification guidance when signup has no session', async ({
  page,
}) => {
  await page.route('**/auth/v1/signup**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ...testUser,
        id: 'new-user',
        email: 'new@example.com',
        identities: [],
      }),
    });
  });

  await page.goto('/login');
  await page.getByRole('button', { name: '注册' }).click();
  await page.getByLabel('邮箱地址').fill('new@example.com');
  await page.getByLabel('密码', { exact: true }).fill('password123');
  await page.getByLabel('确认密码').fill('password123');
  await page.getByRole('button', { name: '创建账户' }).click();

  await expect(page.getByRole('status')).toContainText('请前往邮箱完成验证');
  await expect(page).toHaveURL(/\/login$/);
});

test('blocks mismatched registration passwords before a request', async ({
  page,
}) => {
  let signupRequests = 0;
  await page.route('**/auth/v1/signup**', async (route) => {
    signupRequests += 1;
    await route.fulfill({ status: 500, body: '{}' });
  });

  await page.goto('/login');
  await page.getByRole('button', { name: '注册' }).click();
  await page.getByLabel('邮箱地址').fill('new@example.com');
  await page.getByLabel('密码', { exact: true }).fill('password123');
  await page.getByLabel('确认密码').fill('different123');
  await page.getByRole('button', { name: '创建账户' }).click();

  await expect(page.getByRole('alert')).toHaveText('两次输入的密码不一致。');
  expect(signupRequests).toBe(0);
});

test('keeps passwordless email login as a secondary option', async ({ page }) => {
  await page.route('**/auth/v1/otp**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '{}',
    });
  });
  await page.goto('/login');
  await page
    .getByText('使用 Magic Link / 邮箱验证码', { exact: true })
    .click();
  await page.getByLabel('Magic Link 邮箱').fill('traveler@example.com');
  await page.getByRole('button', { name: '发送登录邮件' }).click();
  await expect(page.getByText('登录邮件已发送')).toBeVisible();
  await expect(page.getByLabel('邮箱验证码')).toBeVisible();
});
