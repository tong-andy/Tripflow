import { CalendarDays, Globe2, MapPinned, Plane, WalletCards } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { mapProviderLabels } from '../domain/profile';
import { useAuth } from '../state/useAuth';
import { useProfile } from '../state/useProfile';
import type { UpdateUserProfileInput } from '../types/profile';
import { mapProviders } from '../types/profile';

const emptyForm: UpdateUserProfileInput = {
  nickname: '',
  homeLocation: '',
  defaultCurrency: 'CNY',
  defaultTimezone: 'Asia/Shanghai',
  defaultMapProvider: 'system',
  showExpenses: true,
  showPurchases: true,
  showJournals: true,
  showMediaNotes: false,
};

const recordPreferenceOptions = [
  { key: 'showExpenses', label: '花费', description: '预算、分类支出与消费记录' },
  { key: 'showPurchases', label: '购物', description: '想买和已经购买的物品' },
  { key: 'showJournals', label: '回忆', description: '每日文字记录与评分' },
  { key: 'showMediaNotes', label: '素材', description: '可选的素材线索管理' },
] as const;

export function ProfilePage() {
  const { user } = useAuth();
  const { profile, annualStats, isLoading, isSaving, error, saveProfile, retry, clearError } =
    useProfile();
  const [form, setForm] = useState<UpdateUserProfileInput>(emptyForm);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) queueMicrotask(() => setForm(profile));
  }, [profile]);

  useEffect(() => {
    queueMicrotask(() => void retry());
  }, [retry]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaved(false);
    await saveProfile(form);
    setSaved(true);
  }

  const stats = [
    { label: '完成旅行', value: `${annualStats.completedTrips} 趟`, icon: Plane },
    { label: '旅行总天数', value: `${annualStats.totalDays} 天`, icon: CalendarDays },
    { label: '目的地', value: `${annualStats.destinations} 个`, icon: MapPinned },
    {
      label: '最长旅行',
      value: annualStats.longestTrip
        ? `${annualStats.longestTrip.name} · ${annualStats.longestTrip.days} 天`
        : '暂无',
      icon: Globe2,
    },
  ];
  const enabledRecordModules = recordPreferenceOptions.filter(
    ({ key }) => form[key],
  ).length;

  return (
    <section>
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand">Account</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">我的</h1>
        <p className="mt-2 text-sm text-muted">跨旅行管理个人资料、默认设置与年度回顾。</p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <form onSubmit={(event) => void submit(event).catch(() => undefined)} className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-7">
          <h2 className="text-lg font-bold">个人资料与偏好</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="sm:col-span-2"><span className="field-label">邮箱</span><input aria-label="用户邮箱" readOnly value={user?.email ?? ''} className="field-input bg-stone-50 text-muted" /></label>
            <label><span className="field-label">昵称（可选）</span><input aria-label="昵称" value={form.nickname} onChange={(event) => setForm({ ...form, nickname: event.target.value })} className="field-input" /></label>
            <label><span className="field-label">常用出发地（可选）</span><input aria-label="常用出发地" value={form.homeLocation} onChange={(event) => setForm({ ...form, homeLocation: event.target.value })} className="field-input" /></label>
            <label><span className="field-label">默认货币</span><input aria-label="默认货币" required maxLength={3} pattern="[A-Za-z]{3}" value={form.defaultCurrency} onChange={(event) => setForm({ ...form, defaultCurrency: event.target.value.toUpperCase() })} className="field-input" /></label>
            <label><span className="field-label">默认时区</span><input aria-label="默认时区" required value={form.defaultTimezone} onChange={(event) => setForm({ ...form, defaultTimezone: event.target.value })} className="field-input" placeholder="Asia/Shanghai" /></label>
            <label className="sm:col-span-2"><span className="field-label">默认地图</span><select aria-label="默认地图" value={form.defaultMapProvider} onChange={(event) => setForm({ ...form, defaultMapProvider: event.target.value as UpdateUserProfileInput['defaultMapProvider'] })} className="field-input">{mapProviders.map((provider) => <option key={provider} value={provider}>{mapProviderLabels[provider]}</option>)}</select></label>
          </div>
          <fieldset className="mt-7 border-t border-line pt-6">
            <legend className="text-base font-bold">记录偏好</legend>
            <p className="mt-1 text-xs leading-5 text-muted">选择记录页面需要显示的模块。关闭模块不会删除任何数据。</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {recordPreferenceOptions.map(({ key, label, description }) => (
                <label key={key} className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line p-4">
                  <input
                    type="checkbox"
                    aria-label={`显示${label}`}
                    checked={form[key]}
                    disabled={form[key] && enabledRecordModules === 1}
                    onChange={(event) => setForm({ ...form, [key]: event.target.checked })}
                    className="mt-0.5 size-4 accent-[var(--color-brand)]"
                  />
                  <span><span className="block text-sm font-semibold">{label}</span><span className="mt-1 block text-xs leading-5 text-muted">{description}</span></span>
                </label>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted">至少保留一个记录模块。</p>
          </fieldset>
          {error ? <div role="alert" className="mt-4 flex justify-between rounded-xl bg-red-50 p-3 text-sm text-red-700"><span>{error}</span><button type="button" onClick={clearError}>关闭</button></div> : null}
          {saved ? <p role="status" className="mt-4 text-sm font-semibold text-brand">设置已保存</p> : null}
          <button disabled={isLoading || isSaving} className="mt-5 min-h-11 rounded-xl bg-ink px-5 text-sm font-semibold text-white disabled:opacity-50">{isSaving ? '保存中…' : '保存设置'}</button>
        </form>

        <div>
          <div className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-7">
            <p className="text-xs font-bold text-brand">{annualStats.year} 年度旅行</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {stats.map(({ label, value, icon: Icon }) => <article key={label} className="rounded-2xl bg-canvas p-4"><Icon className="size-4 text-brand" /><p className="mt-3 text-xs text-muted">{label}</p><p className="mt-1 font-bold">{value}</p></article>)}
            </div>
          </div>
          <div className="mt-4 rounded-3xl border border-line bg-white p-5 shadow-card sm:p-7">
            <div className="flex items-center gap-2"><WalletCards className="size-4 text-brand" /><h2 className="font-bold">本年度消费</h2></div>
            {Object.keys(annualStats.expensesByCurrency).length ? <div className="mt-4 space-y-2">{Object.entries(annualStats.expensesByCurrency).map(([currency, amount]) => <div key={currency} className="flex justify-between text-sm"><span className="text-muted">{currency}</span><span className="font-bold tabular-nums">{new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 2 }).format(amount)}</span></div>)}</div> : <p className="mt-4 text-sm text-muted">本年度暂无消费记录。</p>}
            <p className="mt-4 text-xs leading-5 text-muted">不同币种分别统计，不使用自动汇率，也不会直接相加。</p>
          </div>
        </div>
      </div>
    </section>
  );
}
