import { ArrowLeft, ChevronDown, X } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { mapProviderLabels } from '../../domain/profile';
import { useAuth } from '../../state/useAuth';
import { useProfile } from '../../state/useProfile';
import type { UpdateUserProfileInput } from '../../types/profile';
import { mapProviders } from '../../types/profile';
import { TimezoneCombobox } from '../ui/TimezoneCombobox';

const emptyForm: UpdateUserProfileInput = {
  nickname: '', homeLocation: '', defaultCurrency: 'CNY',
  defaultTimezone: 'Asia/Shanghai', defaultMapProvider: 'system',
  showExpenses: true, showPurchases: true, showJournals: true, showMediaNotes: false,
};

const recordOptions = [
  { key: 'showExpenses', label: '花费', description: '预算、分类支出与消费记录' },
  { key: 'showPurchases', label: '购物', description: '想买和已经购买的物品' },
  { key: 'showJournals', label: '回忆', description: '每日文字记录与评分' },
  { key: 'showMediaNotes', label: '素材', description: '可选的素材线索管理' },
] as const;

export function ProfileSettingsDrawer({ open, onClose }: { open: boolean; onClose(): void }) {
  const { user } = useAuth();
  const { profile, isLoading, isSaving, error, saveProfile, clearError } = useProfile();
  const [form, setForm] = useState<UpdateUserProfileInput>(emptyForm);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) queueMicrotask(() => setForm(profile));
  }, [profile]);

  if (!open) return null;
  const enabledModules = recordOptions.filter(({ key }) => form[key]).length;
  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaved(false);
    await saveProfile(form);
    setSaved(true);
  }

  return (
    <div className="fixed inset-0 z-50 h-dvh overflow-hidden bg-ink/35 md:flex md:justify-end" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="profile-settings-title" className="ml-auto h-dvh min-h-0 w-full overflow-y-auto bg-canvas px-5 pb-10 pt-[max(1rem,env(safe-area-inset-top))] shadow-2xl md:max-w-xl md:p-7">
        <div className="flex items-center justify-between gap-4"><button type="button" onClick={onClose} className="inline-flex min-h-11 items-center gap-2 rounded-xl text-sm font-semibold md:hidden"><ArrowLeft className="size-4" />返回</button><div><p className="text-xs font-bold text-brand">PROFILE & PREFERENCES</p><h2 id="profile-settings-title" className="mt-1 text-2xl font-bold">设置</h2></div><button type="button" aria-label="关闭设置" onClick={onClose} className="hidden size-10 place-items-center rounded-full border border-line bg-white text-muted md:grid"><X className="size-4" /></button></div>
        <form onSubmit={(event) => void submit(event).catch(() => undefined)} className="mt-6 space-y-4">
          <details open className="group rounded-3xl border border-line bg-white shadow-card"><summary className="flex min-h-16 cursor-pointer list-none items-center justify-between px-5 font-bold">个人资料<ChevronDown className="size-4 text-muted transition-transform group-open:rotate-180" /></summary><div className="grid gap-4 border-t border-line p-5 sm:grid-cols-2"><label className="sm:col-span-2"><span className="field-label">邮箱</span><input aria-label="用户邮箱" readOnly value={user?.email ?? ''} className="field-input bg-stone-50 text-muted" /></label><label><span className="field-label">昵称（可选）</span><input aria-label="昵称" value={form.nickname} onChange={(event) => setForm({ ...form, nickname: event.target.value })} className="field-input" /></label><label><span className="field-label">常用出发地（可选）</span><input aria-label="常用出发地" value={form.homeLocation} onChange={(event) => setForm({ ...form, homeLocation: event.target.value })} className="field-input" /></label></div></details>
          <details open className="group rounded-3xl border border-line bg-white shadow-card"><summary className="flex min-h-16 cursor-pointer list-none items-center justify-between px-5 font-bold">偏好设置<ChevronDown className="size-4 text-muted transition-transform group-open:rotate-180" /></summary><div className="border-t border-line p-5"><div className="grid gap-4 sm:grid-cols-2"><label><span className="field-label">默认货币</span><input aria-label="默认货币" required maxLength={3} pattern="[A-Za-z]{3}" value={form.defaultCurrency} onChange={(event) => setForm({ ...form, defaultCurrency: event.target.value.toUpperCase() })} className="field-input" /></label><TimezoneCombobox label="默认时区" value={form.defaultTimezone} onChange={(value) => setForm({ ...form, defaultTimezone: value })} /><label className="sm:col-span-2"><span className="field-label">默认地图</span><select aria-label="默认地图" value={form.defaultMapProvider} onChange={(event) => setForm({ ...form, defaultMapProvider: event.target.value as UpdateUserProfileInput['defaultMapProvider'] })} className="field-input">{mapProviders.map((provider) => <option key={provider} value={provider}>{mapProviderLabels[provider]}</option>)}</select></label></div><fieldset className="mt-6 border-t border-line pt-5"><legend className="font-bold">记录偏好</legend><p className="mt-1 text-xs text-muted">关闭模块只隐藏入口，不会删除数据。</p><div className="mt-4 grid gap-3 sm:grid-cols-2">{recordOptions.map(({ key, label, description }) => <label key={key} className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line p-4"><input type="checkbox" aria-label={`显示${label}`} checked={form[key]} disabled={form[key] && enabledModules === 1} onChange={(event) => setForm({ ...form, [key]: event.target.checked })} className="mt-0.5 size-4" /><span><span className="block text-sm font-semibold">{label}</span><span className="mt-1 block text-xs text-muted">{description}</span></span></label>)}</div></fieldset></div></details>
          {error ? <div role="alert" className="flex justify-between rounded-xl bg-red-50 p-3 text-sm text-red-700"><span>{error}</span><button type="button" onClick={clearError}>关闭</button></div> : null}
          <div className="sticky bottom-0 flex items-center gap-4 border-t border-line bg-canvas py-4">{saved ? <p role="status" className="text-sm font-semibold text-brand">设置已保存</p> : null}<button disabled={isLoading || isSaving} className="ml-auto min-h-11 rounded-xl bg-ink px-5 text-sm font-semibold text-white disabled:opacity-50">{isSaving ? '保存中…' : '保存设置'}</button></div>
        </form>
      </section>
    </div>
  );
}
