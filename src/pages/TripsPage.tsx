import { CalendarCheck2, CalendarDays, Globe2, MapPinned, Plane, Plus, Settings, Trash2, WalletCards } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import { ProfileSettingsDrawer } from '../components/profile/ProfileSettingsDrawer';
import { TravelFootprintMap } from '../components/trips/TravelFootprintMap';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { NoTripState } from '../components/ui/NoTripState';
import { PageHeader } from '../components/ui/PageHeader';
import { StatusBadge } from '../components/ui/StatusBadge';
import { buildAnnualTravelStats } from '../domain/profile';
import { getTripStatus } from '../domain/travelMode';
import type { AppShellContext } from '../layouts/AppShell';
import { formatDateRange } from '../lib/formatters';
import { useProfile } from '../state/useProfile';
import { useTrips } from '../state/useTrips';

const statusLabels = { upcoming: '即将出发', active: '旅行中', completed: '已完成' } as const;

export function TripsPage() {
  const { trips, selectTrip, deleteTrip, isSaving } = useTrips();
  const { expenses, purchases } = useProfile();
  const { openNewTrip } = useOutletContext<AppShellContext>();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [deletingTripId, setDeletingTripId] = useState<string>();
  const years = useMemo(() => [...new Set(trips.map((trip) => Number(trip.startDate.slice(0, 4))))].sort((a, b) => b - a), [trips]);
  const rawYear = params.get('year');
  const selectedYear = rawYear === 'all' ? null : years.includes(Number(rawYear)) ? Number(rawYear) : (years[0] ?? null);
  const filteredTrips = selectedYear === null ? trips : trips.filter((trip) => Number(trip.startDate.slice(0, 4)) === selectedYear);
  const stats = buildAnnualTravelStats(trips, expenses, purchases, selectedYear);
  const deletingTrip = trips.find((trip) => trip.id === deletingTripId);
  const settingsOpen = params.get('settings') === 'profile';

  function updateParams(next: { year?: number | null; settings?: boolean }) {
    const updated = new URLSearchParams(params);
    if ('year' in next) updated.set('year', next.year === null ? 'all' : String(next.year));
    if ('settings' in next) {
      if (next.settings) updated.set('settings', 'profile');
      else updated.delete('settings');
    }
    setParams(updated, { replace: true });
  }

  function openTrip(tripId: string) {
    selectTrip(tripId);
    void navigate('/overview');
  }

  const statCards = [
    { label: '旅行次数', value: `${stats.totalTrips} 趟`, icon: Plane },
    { label: '已完成', value: `${stats.completedTrips} 趟`, icon: CalendarCheck2 },
    { label: '旅行天数', value: `${stats.totalDays} 天`, icon: CalendarDays },
    { label: '去过城市', value: `${stats.cities} 个`, icon: MapPinned },
    { label: '国家 / 地区', value: `${stats.countries} 个`, icon: Globe2 },
  ];

  return <section>
    <PageHeader eyebrow="My travel life" title="我的旅行" description="查看你的旅行足迹、年度统计和所有旅程。" action={<div className="flex gap-2"><button type="button" aria-label="打开设置" onClick={() => updateParams({ settings: true })} className="grid size-11 place-items-center rounded-xl border border-line bg-white text-muted hover:text-ink"><Settings className="size-4" /></button><button type="button" onClick={openNewTrip} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-ink px-4 text-sm font-semibold text-white"><Plus className="size-4" />新建旅行</button></div>} />

    <div className="mt-8"><TravelFootprintMap trips={filteredTrips} onOpenTrip={openTrip} /></div>

    <div className="mt-6 overflow-x-auto pb-1"><div role="group" aria-label="旅行年份" className="flex min-w-max gap-2">{years.map((year) => <button key={year} type="button" aria-pressed={selectedYear === year} onClick={() => updateParams({ year })} className={`rounded-full px-4 py-2 text-sm font-semibold ${selectedYear === year ? 'bg-ink text-white' : 'border border-line bg-white text-muted'}`}>{year}</button>)}<button type="button" aria-pressed={selectedYear === null} onClick={() => updateParams({ year: null })} className={`rounded-full px-4 py-2 text-sm font-semibold ${selectedYear === null ? 'bg-ink text-white' : 'border border-line bg-white text-muted'}`}>全部</button></div></div>

    <section aria-label="旅行统计" className="mt-5 rounded-3xl bg-ink p-5 text-white shadow-card sm:p-7"><div className="flex items-end justify-between"><div><p className="text-xs font-bold tracking-[0.16em] text-white/50">{selectedYear ?? 'ALL YEARS'}</p><h2 className="mt-2 text-2xl font-bold">旅行 Dashboard</h2></div><Globe2 className="size-7 text-white/35" /></div><div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">{statCards.map(({ label, value, icon: Icon }) => <article key={label} className="rounded-2xl bg-white/8 p-4"><Icon className="size-4 text-white/60" /><p className="mt-4 text-xs text-white/55">{label}</p><p className="mt-1 text-xl font-bold">{value}</p></article>)}</div></section>

    <div className="mt-4 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
      <section aria-label="旅行消费" className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-7"><div className="flex items-center gap-2"><WalletCards className="size-5 text-brand" /><h2 className="font-bold">{selectedYear ?? '累计'}旅行消费</h2></div>{Object.keys(stats.expensesByCurrency).length ? <div className="mt-5 grid gap-3 sm:grid-cols-2">{Object.entries(stats.expensesByCurrency).map(([currency, amount]) => <article key={currency} className="rounded-2xl bg-canvas p-4"><p className="text-xs font-bold text-muted">{currency}</p><p className="mt-2 text-2xl font-bold tabular-nums">{new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 2 }).format(amount)}</p></article>)}</div> : <p className="mt-5 rounded-2xl bg-canvas p-5 text-sm text-muted">当前范围暂无消费记录。</p>}<p className="mt-4 text-xs text-muted">Expense 与应计入的 Purchase 按币种分别统计，不进行汇率换算。</p></section>
      <section aria-label="最长旅行" className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-7"><CalendarDays className="size-5 text-brand" /><p className="mt-5 text-xs font-bold text-muted">最长已完成旅行</p>{stats.longestTrip ? <><h2 className="mt-2 text-xl font-bold">{stats.longestTrip.name}</h2><p className="mt-1 text-sm text-muted">共 {stats.longestTrip.days} 天</p></> : <><h2 className="mt-2 text-xl font-bold">暂无已完成旅行</h2><p className="mt-1 text-sm text-muted">完成旅行后会在这里留下纪录。</p></>}</section>
    </div>

    <section aria-label="旅行时间轴" className="mt-8"><div className="flex items-end justify-between"><div><p className="text-xs font-bold text-brand">TRIP TIMELINE</p><h2 className="mt-1 text-2xl font-bold">{selectedYear ?? '全部'}旅行时间轴</h2></div><button type="button" onClick={openNewTrip} className="hidden text-sm font-semibold text-brand sm:block">＋ 新建旅行</button></div>
      {filteredTrips.length ? <ol className="mt-5 space-y-4 border-l-2 border-line pl-5 sm:pl-7">{[...filteredTrips].sort((a, b) => b.startDate.localeCompare(a.startDate)).map((trip) => { const status = getTripStatus(trip); const cities = trip.destinations.map((destination) => destination.cityName).join(' · '); return <li key={trip.id} className="relative"><span className="absolute -left-[1.72rem] top-7 size-3 rounded-full border-2 border-white bg-brand sm:-left-[2.22rem]" /><article className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6"><div className="flex items-start gap-4"><button type="button" onClick={() => openTrip(trip.id)} className="min-w-0 flex-1 text-left"><div className="flex flex-wrap items-center gap-2"><span className="text-xs font-bold text-brand">{trip.startDate.slice(5, 7)}月</span><StatusBadge tone={status === 'active' ? 'green' : status === 'upcoming' ? 'amber' : 'gray'}>{statusLabels[status]}</StatusBadge></div><h3 className="mt-2 text-xl font-bold">{trip.name}</h3><p className="mt-1 text-sm text-muted">{cities || trip.destination}</p><p className="mt-3 text-xs text-muted">{formatDateRange(trip.startDate, trip.endDate)} · {trip.days.length} days</p>{trip.destinations.length === 0 ? <p className="mt-2 text-xs text-amber-700">添加城市后可在旅行足迹地图中显示。</p> : null}</button><button type="button" aria-label={`删除旅行：${trip.name}`} disabled={isSaving} onClick={() => setDeletingTripId(trip.id)} className="grid size-10 shrink-0 place-items-center rounded-full border border-line text-muted hover:border-red-200 hover:text-red-600"><Trash2 className="size-4" /></button></div><Link to="/overview" onClick={() => selectTrip(trip.id)} className="mt-5 inline-flex text-sm font-semibold text-brand">进入旅行总览 →</Link></article></li>; })}</ol> : <div className="mt-5">{trips.length ? <div className="rounded-3xl border border-dashed border-line bg-white py-14 text-center text-sm text-muted">这一年还没有旅行</div> : <NoTripState onCreate={openNewTrip} />}</div>}
    </section>

    <ConfirmDialog open={Boolean(deletingTrip)} title="删除旅行？" description={`“${deletingTrip?.name ?? ''}”及其所有关联数据都会删除，此操作无法恢复。`} busy={isSaving} onCancel={() => setDeletingTripId(undefined)} onConfirm={() => { if (!deletingTrip) return; void deleteTrip(deletingTrip.id).then(() => setDeletingTripId(undefined)).catch(() => undefined); }} />
    <ProfileSettingsDrawer open={settingsOpen} onClose={() => updateParams({ settings: false })} />
  </section>;
}
