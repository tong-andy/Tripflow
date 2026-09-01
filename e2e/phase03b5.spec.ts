import { expect, test, type Page } from '@playwright/test';
import { installCloudApiMock, selectDestinationCity } from './cloud';

async function login(page: Page) {
  await page.goto('/login');
  await page.getByLabel('邮箱地址').fill('e2e@example.com');
  await page.getByLabel('密码').fill('password123');
  await page.getByRole('button', { name: '登录 TripFlow' }).click();
}

async function createTrip(page: Page, name: string, city: string, start: string, end: string) {
  await page.goto('/trips');
  await page.getByRole('button', { name: '新建旅行' }).first().click();
  await page.getByLabel('旅行名称').fill(name);
  await selectDestinationCity(page, city);
  await page.getByLabel('出发地').fill('上海');
  await page.getByLabel('出发日期').fill(start);
  await page.getByLabel('返程日期').fill(end);
  await page.getByRole('button', { name: '创建旅行' }).click();
}

test('Phase 03B.5 keeps one responsive IA and connects footprint, timeline, overview and preparation', async ({ page }) => {
  await installCloudApiMock(page);
  await login(page);
  await expect(page.getByRole('img', { name: /显示 0 个去过的城市/ })).toBeVisible();
  await expect(page.getByRole('button', { name: '聚焦足迹' })).toBeDisabled();
  await createTrip(page, '2025 东京', '东京', '2025-06-01', '2025-06-03');
  await createTrip(page, '2025 镰仓', '镰仓', '2025-07-01', '2025-07-02');
  await createTrip(page, '2026 巴黎', '巴黎', '2026-10-01', '2026-10-05');
  await page.goto('/trips');

  const navigation = page.getByRole('navigation', { name: page.viewportSize()!.width < 768 ? '移动端主导航' : '主导航' });
  for (const label of ['我的旅行', '旅行总览', '准备', '行程', '记录']) {
    await expect(navigation.getByRole('link', { name: label, exact: true })).toBeVisible();
  }
  await expect(navigation.getByRole('link', { name: '我的', exact: true })).toHaveCount(0);
  await expect(page.getByLabel('选择当前旅行')).toHaveCount(0);
  await expect(page.getByRole('button', { name: '新建旅行', exact: true })).toHaveCount(1);

  await expect(page.getByRole('region', { name: '世界旅行足迹' })).toBeVisible();
  await expect(page.getByTestId('world-country-boundaries')).toHaveAttribute('href', '/data/world-110m.svg');
  const footprint = page.getByTestId('travel-footprint-svg');
  await expect(footprint).toHaveAttribute('data-view-box', '0 35 1000 375');
  await page.getByRole('button', { name: '聚焦足迹' }).click();
  await expect(footprint).toHaveAttribute('data-view-mode', 'focus');
  await expect(footprint).not.toHaveAttribute('data-view-box', '0 35 1000 375');
  await page.getByRole('button', { name: '全球', exact: true }).click();
  await expect(page.getByRole('region', { name: '旅行时间轴' })).toContainText('2026 巴黎');
  await page.getByRole('button', { name: '2025', exact: true }).click();
  await expect(page.getByRole('img', { name: /显示 2 个去过的城市/ })).toBeVisible();
  await expect(page.getByRole('region', { name: '旅行时间轴' })).toContainText('2025 东京');
  await expect(page.getByRole('region', { name: '旅行时间轴' })).not.toContainText('2026 巴黎');
  if (page.viewportSize()!.width < 640) {
    const nearbyCluster = page.getByLabel(/查看城市群：.*东京.*镰仓|查看城市群：.*镰仓.*东京/);
    await expect(nearbyCluster).toBeVisible();
    await nearbyCluster.click();
    await expect(footprint).toHaveAttribute('data-view-mode', 'focus');
    await nearbyCluster.click();
    const clusterDetails = page.getByRole('region', { name: '世界旅行足迹' }).getByRole('status');
    await expect(clusterDetails).toContainText('东京 · 日本');
    await expect(clusterDetails).toContainText('镰仓 · 日本');
    await expect(clusterDetails).toContainText('1 趟关联旅行');
  } else {
    await page.getByLabel('查看城市：镰仓').click();
    await expect(page.getByRole('region', { name: '世界旅行足迹' }).getByRole('status')).toContainText('2025 镰仓');
  }
  await page.getByRole('button', { name: '全部', exact: true }).click();
  await expect(page.getByRole('img', { name: /显示 3 个去过的城市/ })).toBeVisible();
  if (page.viewportSize()!.width < 640) {
    await expect(page.getByRole('button', { name: '查看城市：巴黎' })).toBeVisible();
    await expect(page.getByRole('button', { name: /查看城市群/ })).toBeVisible();
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  await page.getByRole('button', { name: '打开设置' }).click();
  await expect(page.getByRole('dialog', { name: '设置' })).toBeVisible();
  const closeSettings = page.getByRole('button', { name: page.viewportSize()!.width < 768 ? '返回' : '关闭设置' });
  await closeSettings.click();

  await page.getByRole('region', { name: '旅行时间轴' })
    .locator('article')
    .filter({ hasText: '2026 巴黎' })
    .getByRole('link', { name: '进入旅行总览' })
    .click();
  await expect(page.getByRole('heading', { name: '2026 巴黎' })).toBeVisible();
  await expect(page.getByLabel('选择当前旅行')).toBeVisible();
  await page.getByRole('button', { name: /2026 巴黎/ }).first().click();
  await expect(page.getByRole('button', { name: /查看全部旅行/ })).toBeVisible();
  await page.getByRole('button', { name: /2025 东京/ }).click();
  await expect(page.getByRole('heading', { name: '2025 东京' })).toBeVisible();

  await navigation.getByRole('link', { name: '准备', exact: true }).click();
  for (const label of ['通行', '住宿', '证件', '预订与活动', '网络与设备', '生活用品']) {
    await expect(page.getByText(label, { exact: true })).toBeVisible();
  }
  await expect(page.getByRole('button', { name: '新增事项' })).toHaveCount(6);
  const documentSection = page.locator('details').filter({ hasText: '证件' });
  await documentSection.getByRole('button', { name: '新增事项' }).click();
  await expect(page.getByLabel('分类')).toHaveValue('documents');
  await page.getByLabel('事项名称').fill('检查护照');
  await page.getByRole('button', { name: '添加', exact: true }).click();
  await expect(documentSection.getByText('检查护照')).toBeVisible();

  const documentGrid = page.getByTestId('preparation-grid-documents');
  const columnCount = await documentGrid.evaluate((element) =>
    getComputedStyle(element).gridTemplateColumns.split(' ').length,
  );
  const viewportWidth = page.viewportSize()!.width;
  expect(columnCount).toBe(viewportWidth >= 1200 ? 3 : viewportWidth >= 768 ? 2 : 1);

  await page.getByLabel('标记完成：检查护照').click();
  await expect(page.getByLabel('标记未完成：检查护照')).toBeVisible();
  await page.getByLabel('编辑：检查护照').click();
  await page.getByLabel('备注（可选）').fill('有效期六个月以上');
  await page.getByRole('button', { name: '保存', exact: true }).click();
  await expect(documentSection.getByText('有效期六个月以上')).toBeVisible();

  await documentSection.locator('summary').click();
  await expect(documentSection).not.toHaveAttribute('open', '');
  await documentSection.locator('summary').click();
  await expect(documentSection).toHaveAttribute('open', '');

  await page.getByLabel('删除：检查护照').click();
  await page.getByRole('button', { name: '确认删除' }).click();
  await expect(documentSection.getByText('检查护照')).toHaveCount(0);
});
