import { expect, test, type Page } from '@playwright/test';
import { installCloudApiMock, selectDestinationCity } from './cloud';

function dateOffset(days: number) {
  const date = new Date(); date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}

async function login(page: Page) {
  await page.goto('/login'); await page.getByLabel('邮箱地址').fill('e2e@example.com');
  await page.getByLabel('密码').fill('password123'); await page.getByRole('button',{name:'登录 TripFlow'}).click();
}

async function createTrip(page: Page, name: string, start = dateOffset(1), end = dateOffset(2)) {
  await page.goto('/trips');
  await expect(page.getByRole('heading',{name:'我的旅行'})).toBeVisible();
  await page.getByRole('button',{name:'新建旅行'}).first().click();
  await page.getByLabel('旅行名称').fill(name); await selectDestinationCity(page, '东京');
  await page.getByLabel('出发地').fill('上海'); await page.getByLabel('出发日期').fill(start); await page.getByLabel('返程日期').fill(end);
  await page.getByRole('button',{name:'创建旅行'}).click();
}

async function chooseTimezone(page: Page, label: string, query: string, option: RegExp) {
  const input = page.getByRole('combobox',{name:label});
  await input.fill(query); await page.getByRole('option',{name:option}).click();
}

test('puts the annual dashboard on My Trips and opens profile settings from the header',async({page})=>{
  await installCloudApiMock(page); await login(page); await createTrip(page,'年度面板旅行');
  await page.getByRole('link',{name:'我的旅行',exact:true}).click();
  const dashboard=page.getByRole('region',{name:'旅行统计'}); await expect(dashboard).toBeVisible();
  await expect(dashboard.getByText('旅行次数')).toBeVisible(); await expect(dashboard.getByText('1 趟').first()).toBeVisible();
  await page.getByRole('button',{name:'打开设置'}).click();
  await page.getByLabel('昵称').fill('旅行者');
  await chooseTimezone(page,'默认时区','东京',/东京.*Asia\/Tokyo/);
  await page.getByRole('button',{name:'保存设置'}).click(); await expect(page.getByText('设置已保存')).toBeVisible();
  await page.reload(); await expect(page.getByRole('dialog',{name:'设置'})).toBeVisible();
  await expect(page.getByLabel('昵称')).toHaveValue('旅行者');
  await expect(page.getByRole('combobox',{name:'默认时区'})).toHaveValue(/Asia\/Tokyo/);
});

test('renders a unified single-currency pie and switches currencies without mixing',async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='desktop-1440','single chart flow');
  await installCloudApiMock(page); await login(page); await createTrip(page,'图表旅行');
  await page.getByRole('link',{name:'记录',exact:true}).click();
  const chart=page.getByRole('region',{name:'消费分类饼图'}); await expect(chart.getByText(/记录花费或计入花费/)).toBeVisible();
  await page.getByRole('button',{name:'新增花费'}).click(); await page.getByLabel('消费名称').fill('拉面'); await page.getByLabel('消费金额').fill('200'); await page.getByLabel('消费币种').fill('JPY'); await page.getByLabel('消费分类',{exact:true}).selectOption('food'); await page.getByRole('button',{name:'添加',exact:true}).click();
  await page.getByRole('button',{name:'购物',exact:true}).click(); await page.getByRole('button',{name:'新增购物'}).click(); await page.getByLabel('物品名称').fill('相机配件'); await page.getByLabel('金额',{exact:true}).fill('800'); await page.getByLabel('币种',{exact:true}).fill('JPY'); await page.getByLabel('已购买').check(); await page.getByRole('button',{name:'添加',exact:true}).click();
  await page.getByRole('button',{name:'花费',exact:true}).click(); await page.getByRole('button',{name:'新增花费'}).click(); await page.getByLabel('消费名称').fill('地铁'); await page.getByLabel('消费金额').fill('100'); await page.getByLabel('消费币种').fill('CNY'); await page.getByLabel('消费分类',{exact:true}).selectOption('transport'); await page.getByRole('button',{name:'添加',exact:true}).click();
  await page.getByRole('button',{name:'设置'}).click(); await page.getByLabel('预算金额').fill('2000'); await page.getByLabel('预算币种').fill('JPY'); await page.getByRole('button',{name:'保存预算'}).click();
  await expect(chart.getByRole('button',{name:'JPY'})).toHaveAttribute('aria-pressed','true'); await expect(chart.getByText('餐饮')).toBeVisible(); await expect(chart.getByText('20.0%')).toBeVisible(); await expect(chart.getByText('购物')).toBeVisible(); await expect(chart.getByText('80.0%')).toBeVisible();
  await chart.getByRole('button',{name:'CNY'}).click(); await expect(chart.getByText('交通')).toBeVisible(); await expect(chart.getByText('100.0%')).toBeVisible(); await expect(chart.getByText('购物')).toHaveCount(0);
});

test('creates, edits, persists and isolates trip notes',async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='mobile-390','mobile trip note flow');
  await installCloudApiMock(page); await login(page); await createTrip(page,'备注旅行 A');
  await page.getByLabel('查看和编辑旅行备注').click(); await page.getByRole('textbox',{name:'旅行备注'}).fill('主要目标：看展览'); await page.getByRole('button',{name:'保存旅行备注'}).click(); await expect(page.getByLabel('查看和编辑旅行备注')).toContainText('主要目标：看展览');
  await page.reload(); await expect(page.getByLabel('查看和编辑旅行备注')).toContainText('主要目标：看展览');
  await page.getByLabel('查看和编辑旅行备注').click(); await page.getByRole('textbox',{name:'旅行备注'}).fill('主要目标：看展览和赏樱'); await page.getByRole('button',{name:'保存旅行备注'}).click();
  await createTrip(page,'备注旅行 B'); await expect(page.getByLabel('查看和编辑旅行备注')).toContainText('添加旅行备注');
  await page.getByLabel('选择当前旅行').selectOption({label:'备注旅行 A'}); await expect(page.getByLabel('查看和编辑旅行备注')).toContainText('看展览和赏樱');
});

test('uses profile timezone for new trips while existing trips remain independent',async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='desktop-1440','single timezone relationship flow');
  const store=await installCloudApiMock(page); await login(page); await createTrip(page,'原有旅行');
  const originalTimezone=String(store.trips[0]?.timezone);
  await page.getByRole('link',{name:'我的旅行',exact:true}).click(); await page.getByRole('button',{name:'打开设置'}).click();
  await chooseTimezone(page,'默认时区','东京',/东京.*Asia\/Tokyo/); await page.getByRole('button',{name:'保存设置'}).click();
  await createTrip(page,'新旅行'); await page.getByRole('button',{name:'编辑旅行',exact:true}).click(); await expect(page.getByRole('combobox',{name:'旅行时区'})).toHaveValue(/Asia\/Tokyo/); await page.getByRole('button',{name:'取消'}).click();
  await page.getByLabel('选择当前旅行').selectOption({label:'原有旅行'}); await expect(store.trips[0]?.timezone).toBe(originalTimezone);
  await page.getByRole('button',{name:'编辑旅行',exact:true}).click(); await chooseTimezone(page,'旅行时区','巴黎',/巴黎.*Europe\/Paris/); await page.getByRole('button',{name:'保存旅行'}).click();
  await page.getByRole('button',{name:'编辑旅行',exact:true}).click(); await expect(page.getByRole('combobox',{name:'旅行时区'})).toHaveValue(/Europe\/Paris/); await page.getByRole('button',{name:'取消'}).click();
  await page.getByRole('link',{name:'我的旅行',exact:true}).click(); await page.getByRole('button',{name:'打开设置'}).click(); await expect(page.getByRole('combobox',{name:'默认时区'})).toHaveValue(/Asia\/Tokyo/);
});
