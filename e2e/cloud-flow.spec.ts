import { expect, test } from '@playwright/test';
import { installCloudApiMock } from './cloud';

test('persists the core travel flow across refresh and login sessions', async ({
  page,
}) => {
  await installCloudApiMock(page);
  await page.goto('/login');
  await page.getByLabel('邮箱地址').fill('e2e@example.com');
  await page.getByLabel('密码').fill('password123');
  await page.getByRole('button', { name: '登录 TripFlow' }).click();

  await expect(page).toHaveURL(/\/trips$/);
  await expect(page.getByText('还没有云端旅行')).toBeVisible();
  await page.getByRole('button', { name: '新建旅行' }).first().click();
  await page.getByLabel('旅行名称').fill('杭州周末');
  await page.getByLabel('目的地').fill('杭州');
  await page.getByLabel('出发地').fill('上海');
  await page.getByLabel('出发日期').fill('2026-11-06');
  await page.getByLabel('返程日期').fill('2026-11-08');
  await page.getByRole('button', { name: '创建旅行' }).click();

  await expect(page).toHaveURL(/\/overview$/);
  await expect(page.getByText('杭州周末 · 2026年11月6日 — 11月8日')).toBeVisible();
  await expect(page.getByText('3 天', { exact: true })).toBeVisible();

  await page.reload();
  await expect(page.getByText('杭州周末 · 2026年11月6日 — 11月8日')).toBeVisible();

  await page.getByRole('link', { name: '准备', exact: true }).click();
  await page.getByRole('button', { name: '添加事项' }).click();
  await page.getByLabel('事项名称').fill('打印车票');
  await page.getByLabel('分类').selectOption('booking');
  await page.getByRole('button', { name: '添加', exact: true }).click();
  await expect(page.getByText('打印车票')).toBeVisible();
  await page.getByRole('button', { name: '标记完成：打印车票' }).click();
  await expect(
    page.getByRole('button', { name: '标记未完成：打印车票' }),
  ).toBeVisible();

  await page.getByRole('link', { name: '行程', exact: true }).click();
  await page.getByRole('button', { name: '添加安排' }).first().click();
  await page.getByLabel('时间').fill('16:00');
  await page.getByLabel('地点名称').fill('西湖边');
  await page.getByLabel('预计停留（分钟）').fill('120');
  await page.getByRole('button', { name: '添加行程' }).click();

  await page.getByRole('button', { name: '添加安排' }).first().click();
  await page.getByLabel('时间').fill('09:00');
  await page.getByLabel('地点名称').fill('灵隐寺');
  await page.getByLabel('预计停留（分钟）').fill('90');
  await page.getByRole('button', { name: '添加行程' }).click();
  await expect(page.locator('ol li > p:first-child')).toHaveText([
    '09:00',
    '16:00',
  ]);

  await page.getByLabel('退出登录').click();
  await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel('邮箱地址').fill('e2e@example.com');
  await page.getByLabel('密码').fill('password123');
  await page.getByRole('button', { name: '登录 TripFlow' }).click();

  await expect(page).toHaveURL(/\/trips$/);
  await expect(page.getByRole('heading', { name: '杭州周末' })).toBeVisible();
});
