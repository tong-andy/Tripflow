import { expect, test, type Page } from '@playwright/test';
import { installCloudApiMock } from './cloud';

function dateOffset(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

async function createTrip(page: Page, name: string, start: string, end: string) {
  await page.getByRole('link', { name: '旅行', exact: true }).click();
  await page.getByRole('button', { name: '新建旅行' }).first().click();
  await page.getByLabel('旅行名称').fill(name);
  await page.getByLabel('目的地', { exact: true }).fill(`${name}目的地`);
  await page.getByLabel('出发地').fill('上海');
  await page.getByLabel('出发日期').fill(start);
  await page.getByLabel('返程日期').fill(end);
  await page.getByLabel('旅行时区').fill(Intl.DateTimeFormat().resolvedOptions().timeZone);
  await page.getByRole('button', { name: '创建旅行' }).click();
}

async function selectTrip(page: Page, name: string) {
  await page.getByLabel('选择当前旅行').selectOption({ label: name });
}

test('enforces Today routing and keeps the five-item mobile navigation', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-390', 'mobile navigation flow');
  await installCloudApiMock(page);
  await page.goto('/login');
  await page.getByLabel('邮箱地址').fill('e2e@example.com');
  await page.getByLabel('密码').fill('password123');
  await page.getByRole('button', { name: '登录 TripFlow' }).click();

  const today = dateOffset(0);
  await createTrip(page, '进行中旅行', today, today);
  await expect(page).toHaveURL(/\/today$/);
  await createTrip(page, '即将出发旅行', dateOffset(2), dateOffset(3));
  await expect(page).toHaveURL(/\/overview$/);
  await createTrip(page, '已完成旅行', dateOffset(-3), dateOffset(-2));
  await expect(page).toHaveURL(/\/overview$/);

  await selectTrip(page, '进行中旅行');
  await expect(page).toHaveURL(/\/today$/);
  await selectTrip(page, '即将出发旅行');
  await expect(page).toHaveURL(/\/overview$/);
  await selectTrip(page, '进行中旅行');
  await expect(page).toHaveURL(/\/today$/);
  await selectTrip(page, '已完成旅行');
  await expect(page).toHaveURL(/\/overview$/);

  await page.evaluate(() => {
    window.history.pushState({}, '', '/today');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  await expect(page).toHaveURL(/\/overview$/);

  const bottom = page.getByRole('navigation', { name: '移动端主导航' });
  await expect(bottom.getByRole('link', { name: '旅行', exact: true })).toBeVisible();
  await expect(bottom.getByRole('link', { name: '准备', exact: true })).toBeVisible();
  await expect(bottom.getByRole('link', { name: '行程', exact: true })).toBeVisible();
  await expect(bottom.getByRole('link', { name: '记录', exact: true })).toBeVisible();
  await expect(bottom.getByRole('link', { name: '我的', exact: true })).toBeVisible();
  await expect(bottom.getByRole('link', { name: '总览', exact: true })).toHaveCount(0);
  await expect(page.getByLabel('查看通知')).toHaveCount(0);
});

test('persists map preference and scopes trip data including completed history', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-390', 'mobile scoped-data flow');
  await installCloudApiMock(page);
  await page.goto('/login');
  await page.getByLabel('邮箱地址').fill('e2e@example.com');
  await page.getByLabel('密码').fill('password123');
  await page.getByRole('button', { name: '登录 TripFlow' }).click();

  const today = dateOffset(0);
  await createTrip(page, 'A旅行', today, today);
  await page.getByRole('link', { name: '准备', exact: true }).click();
  await page.getByRole('button', { name: '添加事项' }).click();
  await page.getByLabel('事项名称').fill('A护照');
  await page.getByRole('button', { name: '添加', exact: true }).click();
  await page.getByRole('link', { name: '行程', exact: true }).click();
  await page.getByRole('button', { name: '添加安排' }).first().click();
  await page.getByLabel('地点名称').fill('A地点');
  await page.getByPlaceholder('用于调用外部地图导航').fill('上海外滩');
  await page.getByRole('button', { name: '添加行程' }).click();
  await page.getByRole('link', { name: '记录', exact: true }).click();
  await page.getByRole('button', { name: '新增花费' }).click();
  await page.getByLabel('消费名称').fill('A消费');
  await page.getByLabel('消费金额').fill('88');
  await page.getByRole('button', { name: '添加', exact: true }).click();

  await createTrip(page, 'B旅行', dateOffset(2), dateOffset(2));
  await page.getByRole('link', { name: '准备', exact: true }).click();
  await expect(page.getByText('A护照', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: '添加事项' }).click();
  await page.getByLabel('事项名称').fill('B签证');
  await page.getByRole('button', { name: '添加', exact: true }).click();
  await selectTrip(page, 'A旅行');
  await expect(page.getByText('A护照', { exact: true })).toBeVisible();
  await expect(page.getByText('B签证', { exact: true })).toHaveCount(0);
  await page.getByRole('link', { name: '行程', exact: true }).click();
  await expect(page.getByText('A地点', { exact: true })).toBeVisible();
  await selectTrip(page, 'B旅行');
  await expect(page.getByText('A地点', { exact: true })).toHaveCount(0);
  await page.getByRole('link', { name: '记录', exact: true }).click();
  await expect(page.getByText('A消费', { exact: true })).toHaveCount(0);
  await selectTrip(page, 'A旅行');
  await expect(page.getByText('A消费', { exact: true })).toBeVisible();

  await createTrip(page, '历史旅行', dateOffset(-3), dateOffset(-2));
  await page.getByRole('link', { name: '记录', exact: true }).click();
  await page.getByRole('button', { name: '新增花费' }).click();
  await page.getByLabel('消费名称').fill('历史车票');
  await page.getByLabel('消费金额').fill('20');
  await page.getByRole('button', { name: '添加', exact: true }).click();
  await selectTrip(page, 'A旅行');
  await expect(page.getByText('历史车票', { exact: true })).toHaveCount(0);
  await selectTrip(page, '历史旅行');
  await expect(page.getByText('历史车票', { exact: true })).toBeVisible();

  await page.getByRole('link', { name: '我的', exact: true }).click();
  await expect(page.getByRole('heading', { name: '我的' })).toBeVisible();
  await page.getByLabel('默认地图').selectOption('amap');
  await page.getByRole('button', { name: '保存设置' }).click();
  await expect(page.getByText('设置已保存')).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('默认地图')).toHaveValue('amap');
  await selectTrip(page, 'A旅行');
  await page.getByRole('link', { name: '行程', exact: true }).click();
  await expect(page.getByLabel('导航到A地点')).toHaveAttribute('href', /uri\.amap\.com/);
});
