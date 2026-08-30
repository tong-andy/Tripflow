import { CalendarCheck2, CalendarDays, ChevronDown, Globe2, MapPinned, Plane, Route, WalletCards } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { TimezoneCombobox } from '../components/ui/TimezoneCombobox';
import { mapProviderLabels } from '../domain/profile';
import { useAuth } from '../state/useAuth';
import { useProfile } from '../state/useProfile';
import type { UpdateUserProfileInput } from '../types/profile';
import { mapProviders } from '../types/profile';

const emptyForm: UpdateUserProfileInput = {
  nickname: '', homeLocation: '', defaultCurrency: 'CNY',
  defaultTimezone: 'Asia/Shanghai', defaultMapProvider: 'system',
  showExpenses: true, showPurchases: true, showJournals: true, showMediaNotes: false,
};

const recordPreferenceOptions = [
  { key: 'showExpenses', label: '花费', description: '预算、分类支出与消费记录' },
  { key: 'showPurchases', label: '购物', description: '想买和已经购买的物品' },
  { key: 'showJournals', label: '回忆', description: '每日文字记录与评分' },
  { key: 'showMediaNotes', label: '素材', description: '可选的素材线索管理' },
] as const;

export function ProfilePage() {
  const { user } = useAuth();
  const { profile, annualStats, isLoading, isSaving, error, saveProfile, retry, clearError } = useProfile();
  const [form, setForm] = useState<UpdateUserProfileInput>(emptyForm);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) queueMicrotask(() => setForm(profile));
  }, [profile]);
  useEffect(() => { queueMicrotask(() => void retry()); }, [retry]);

  async function submit(event: FormEvent) {
    event.preventDefault(); setSaved(false); await saveProfile(form); setSaved(true);
  }

  const enabledRecordModules = recordPreferenceOptions.filter(({ key }) => form[key]).length;
  const stats = [
    { label: '本年度旅行', value: `${annualStats.totalTrips} 趟`, icon: Plane },
    { label: '已完成旅行', value: `${annualStats.completedTrips} 趟`, icon: CalendarCheck2 },
    { label: '累计旅行天数', value: `${annualStats.totalDays} 天`, icon: CalendarDays },
    { label: '去过的目的地', value: `${annualStats.destinations} 个`, icon: MapPinned },
  ];

  return (
    <section>
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand">Travel dashboard</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">我的</h1>
        <p className="mt-2 text-sm text-muted">回顾长期旅行足迹，在需要时管理个人资料与偏好。</p>
      </div>

      <section aria-label="年度旅行概览" className="mt-7 rounded-3xl bg-ink p-5 text-white shadow-card sm:p-7">
        <div className="flex items-end justify-between gap-4"><div><p className="text-xs font-bold tracking-[0.16em] text-white/50">{annualStats.year}</p><h2 className="mt-2 text-2xl font-bold">年度旅行概览</h2></div><Route className="size-7 text-white/40" /></div>
        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map(({ label, value, icon: Icon }) => <article key={label} className="rounded-2xl bg-white/8 p-4"><Icon className="size-4 text-white/60"/><p className="mt-4 text-xs text-white/55">{label}</p><p className="mt-1 text-xl font-bold">{value}</p></article>)}
        </div>
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <section aria-label="年度旅行消费" className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-7">
          <div className="flex items-center gap-2"><WalletCards className="size-5 text-brand"/><div><p className="text-xs font-bold text-brand">ANNUAL SPENDING</p><h2 className="mt-1 text-lg font-bold">年度旅行消费</h2></div></div>
          {Object.keys(annualStats.expensesByCurrency).length ? <div className="mt-5 grid gap-3 sm:grid-cols-2">{Object.entries(annualStats.expensesByCurrency).map(([currency, amount]) => <article key={currency} className="rounded-2xl bg-canvas p-4"><p className="text-xs font-bold text-muted">{currency}</p><p className="mt-2 text-2xl font-bold tabular-nums">{new Intl.NumberFormat('zh-CN',{maximumFractionDigits:2}).format(amount)}</p></article>)}</div> : <p className="mt-5 rounded-2xl bg-canvas p-5 text-sm text-muted">本年度暂无消费记录。</p>}
          <p className="mt-4 text-xs leading-5 text-muted">Expense 与应计入的 Purchase 按币种分别统计，不进行汇率换算。</p>
        </section>
        <section aria-label="最长旅行" className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-7">
          <Globe2 className="size-5 text-brand"/><p className="mt-5 text-xs font-bold text-muted">最长旅行</p>
          {annualStats.longestTrip?<><h2 className="mt-2 text-xl font-bold">{annualStats.longestTrip.name}</h2><p className="mt-1 text-sm text-muted">共 {annualStats.longestTrip.days} 天</p></>:<><h2 className="mt-2 text-xl font-bold">暂无已完成旅行</h2><p className="mt-1 text-sm text-muted">完成旅行后会在这里留下年度纪录。</p></>}
        </section>
      </div>

      <form onSubmit={(event)=>void submit(event).catch(()=>undefined)} className="mt-8">
        <div className="grid gap-4 lg:grid-cols-2">
          <details className="group rounded-3xl border border-line bg-white shadow-card">
            <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between px-5 font-bold sm:px-7">个人资料<ChevronDown className="size-4 text-muted transition-transform group-open:rotate-180"/></summary>
            <div className="grid gap-4 border-t border-line p-5 sm:grid-cols-2 sm:p-7">
              <label className="sm:col-span-2"><span className="field-label">邮箱</span><input aria-label="用户邮箱" readOnly value={user?.email??''} className="field-input bg-stone-50 text-muted"/></label>
              <label><span className="field-label">昵称（可选）</span><input aria-label="昵称" value={form.nickname} onChange={event=>setForm({...form,nickname:event.target.value})} className="field-input"/></label>
              <label><span className="field-label">常用出发地（可选）</span><input aria-label="常用出发地" value={form.homeLocation} onChange={event=>setForm({...form,homeLocation:event.target.value})} className="field-input"/></label>
            </div>
          </details>

          <details className="group rounded-3xl border border-line bg-white shadow-card">
            <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between px-5 font-bold sm:px-7">偏好设置<ChevronDown className="size-4 text-muted transition-transform group-open:rotate-180"/></summary>
            <div className="border-t border-line p-5 sm:p-7">
              <div className="grid gap-4 sm:grid-cols-2">
                <label><span className="field-label">默认货币</span><input aria-label="默认货币" required maxLength={3} pattern="[A-Za-z]{3}" value={form.defaultCurrency} onChange={event=>setForm({...form,defaultCurrency:event.target.value.toUpperCase()})} className="field-input"/></label>
                <TimezoneCombobox label="默认时区" value={form.defaultTimezone} onChange={value=>setForm({...form,defaultTimezone:value})}/>
                <label className="sm:col-span-2"><span className="field-label">默认地图</span><select aria-label="默认地图" value={form.defaultMapProvider} onChange={event=>setForm({...form,defaultMapProvider:event.target.value as UpdateUserProfileInput['defaultMapProvider']})} className="field-input">{mapProviders.map(provider=><option key={provider} value={provider}>{mapProviderLabels[provider]}</option>)}</select></label>
              </div>
              <fieldset className="mt-6 border-t border-line pt-5"><legend className="font-bold">记录偏好</legend><p className="mt-1 text-xs text-muted">关闭模块只隐藏入口，不会删除数据。</p><div className="mt-4 grid gap-3 sm:grid-cols-2">{recordPreferenceOptions.map(({key,label,description})=><label key={key} className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line p-4"><input type="checkbox" aria-label={`显示${label}`} checked={form[key]} disabled={form[key]&&enabledRecordModules===1} onChange={event=>setForm({...form,[key]:event.target.checked})} className="mt-0.5 size-4"/><span><span className="block text-sm font-semibold">{label}</span><span className="mt-1 block text-xs text-muted">{description}</span></span></label>)}</div><p className="mt-3 text-xs text-muted">至少保留一个记录模块。</p></fieldset>
            </div>
          </details>
        </div>
        {error?<div role="alert" className="mt-4 flex justify-between rounded-xl bg-red-50 p-3 text-sm text-red-700"><span>{error}</span><button type="button" onClick={clearError}>关闭</button></div>:null}
        <div className="mt-4 flex items-center gap-4">{saved?<p role="status" className="text-sm font-semibold text-brand">设置已保存</p>:null}<button disabled={isLoading||isSaving} className="ml-auto min-h-11 rounded-xl bg-ink px-5 text-sm font-semibold text-white disabled:opacity-50">{isSaving?'保存中…':'保存设置'}</button></div>
      </form>
    </section>
  );
}
