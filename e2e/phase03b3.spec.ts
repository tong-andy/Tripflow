import { expect, test, type Page } from '@playwright/test';
import { installCloudApiMock } from './cloud';

function localDate() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

async function login(page: Page) {
  await page.goto('/login');
  await page.getByLabel('邮箱地址').fill('e2e@example.com');
  await page.getByLabel('密码').fill('password123');
  await page.getByRole('button', { name: '登录 TripFlow' }).click();
}

async function createTrip(page: Page, name: string) {
  await page.getByRole('button', { name: '新建旅行' }).first().click();
  await page.getByLabel('旅行名称').fill(name);
  await page.getByLabel('目的地', { exact: true }).fill('东京');
  await page.getByLabel('出发地').fill('上海');
  await page.getByLabel('出发日期').fill(localDate());
  await page.getByLabel('返程日期').fill(localDate());
  await page.getByLabel('旅行时区').fill(Intl.DateTimeFormat().resolvedOptions().timeZone);
  await page.getByRole('button', { name: '创建旅行' }).click();
}

async function addPurchase(page: Page, title: string, amount: string, currency: string, purchased: boolean) {
  await page.getByRole('button', { name: '新增购物' }).click();
  await page.getByLabel('物品名称').fill(title);
  await page.getByLabel('金额', { exact: true }).fill(amount);
  await page.getByLabel('币种', { exact: true }).fill(currency);
  await page.getByLabel('地点', { exact: true }).fill('东京站');
  await page.getByLabel('收礼人').fill('自己');
  if (purchased) await page.getByLabel('已购买').check();
  await page.getByRole('button', { name: '添加', exact: true }).click();
}

test('uses Record naming and persists responsive module preferences', async ({ page }) => {
  await installCloudApiMock(page);
  await login(page);
  await createTrip(page, '模块偏好旅行');
  await page.getByRole('link', { name: '记录', exact: true }).click();
  await expect(page.getByRole('heading', { name: '旅行记录' })).toBeVisible();
  const tabs = page.getByRole('navigation', { name: '记录分类' });
  await expect(tabs.getByRole('button', { name: '花费' })).toBeVisible();
  await expect(tabs.getByRole('button', { name: '购物' })).toBeVisible();
  await expect(tabs.getByRole('button', { name: '回忆' })).toBeVisible();
  await expect(tabs.getByRole('button', { name: '素材' })).toHaveCount(0);
  await expect(page.getByText('归档', { exact: true })).toHaveCount(0);

  await page.getByRole('link', { name: '我的', exact: true }).click();
  await page.getByText('偏好设置', { exact: true }).click();
  await page.getByLabel('显示购物').uncheck();
  await page.getByLabel('显示素材').check();
  await page.getByRole('button', { name: '保存设置' }).click();
  await page.reload();
  await page.getByText('偏好设置', { exact: true }).click();
  await expect(page.getByLabel('显示购物')).not.toBeChecked();
  await expect(page.getByLabel('显示素材')).toBeChecked();
  await page.getByRole('link', { name: '记录', exact: true }).click();
  await expect(tabs.getByRole('button', { name: '购物' })).toHaveCount(0);
  await expect(tabs.getByRole('button', { name: '素材' })).toBeVisible();
});

test('aggregates purchased shopping once and applies only matching currency to budget', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1440', 'single full spending flow');
  await installCloudApiMock(page);
  await login(page);
  await createTrip(page, '购物统计旅行');
  await page.getByRole('link', { name: '记录', exact: true }).click();

  await page.getByRole('button', { name: '新增花费' }).click();
  await page.getByLabel('消费名称').fill('住宿与餐饮');
  await page.getByLabel('消费金额').fill('25000');
  await page.getByLabel('消费币种').fill('JPY');
  await page.getByRole('button', { name: '添加', exact: true }).click();
  await page.getByRole('button', { name: '设置' }).click();
  await page.getByLabel('预算金额').fill('40000');
  await page.getByLabel('预算币种').fill('JPY');
  await page.getByRole('button', { name: '保存预算' }).click();

  await page.getByRole('button', { name: '购物' }).click();
  await addPurchase(page, '想买的镜头', '9000', 'JPY', false);
  await addPurchase(page, '相机配件', '8000', 'JPY', true);
  await addPurchase(page, '旅行贴纸', '100', 'USD', true);
  await page.getByRole('button', { name: '花费', exact: true }).click();
  const total = page.locator('article').filter({ hasText: '总支出' });
  await expect(total).toContainText('33,000');
  await expect(total).toContainText('100');
  await expect(total).not.toContainText('42,000');
  const budget = page.locator('article').filter({ hasText: '剩余预算' });
  await expect(budget).toContainText('7,000');
  await expect(budget).toContainText('其他币种支出未计入当前预算');

  await page.getByRole('button', { name: '购物' }).click();
  const camera = page.locator('article').filter({ hasText: '相机配件' });
  await camera.getByRole('button', { name: '计入花费' }).click();
  await page.getByRole('button', { name: '花费', exact: true }).click();
  await expect(total).toContainText('25,000');
  await expect(budget).toContainText('15,000');
  await page.getByRole('button', { name: '购物' }).click();
  await camera.getByRole('button', { name: '不计入花费' }).click();
  await page.getByRole('button', { name: '花费', exact: true }).click();
  await expect(total).toContainText('33,000');

  await page.getByRole('link', { name: '我的', exact: true }).click();
  const annual = page.getByRole('region', { name: '年度旅行消费' });
  await expect(annual).toContainText('JPY');
  await expect(annual).toContainText('33,000');
  await expect(annual).toContainText('USD');
  await expect(annual).toContainText('100');
});

test('keeps historical material discoverable until the user hides it without deleting data', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-390', 'historical media compatibility');
  const store = await installCloudApiMock(page);
  await login(page);
  await createTrip(page, '历史素材旅行');
  const tripId = String(store.trips[0]?.id);
  const now = new Date().toISOString();
  store.media_notes.push({
    id: 'historical-media', user_id: 'e2e-user', trip_id: tripId,
    trip_day_id: null, itinerary_item_id: null, media_type: 'photo',
    filename: '旧照片.jpg', notes: '', favorite: false,
    created_at: now, updated_at: now,
  });
  await page.reload();
  await page.getByRole('link', { name: '记录', exact: true }).click();
  await expect(page.getByRole('button', { name: '素材' })).toBeVisible();
  await page.getByRole('button', { name: '素材' }).click();
  await expect(page.getByText('旧照片.jpg')).toBeVisible();

  await page.getByRole('link', { name: '我的', exact: true }).click();
  await page.getByText('偏好设置', { exact: true }).click();
  await expect(page.getByLabel('显示素材')).toBeChecked();
  await page.getByLabel('显示素材').uncheck();
  await page.getByRole('button', { name: '保存设置' }).click();
  await page.getByRole('link', { name: '记录', exact: true }).click();
  await expect(page.getByRole('button', { name: '素材' })).toHaveCount(0);
  expect(store.media_notes).toHaveLength(1);
  await page.reload();
  await expect(page.getByRole('button', { name: '素材' })).toHaveCount(0);
  expect(store.media_notes[0]?.filename).toBe('旧照片.jpg');
});
