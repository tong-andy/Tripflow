import { ArrowUpRight, CalendarCheck2, CalendarDays, CheckCircle2, FileText, MapPinned, Pencil, Route, Settings2, WalletCards } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { EditTripDialog } from '../components/trips/EditTripDialog';
import { NoTripState } from '../components/ui/NoTripState';
import { PageHeader } from '../components/ui/PageHeader';
import { StatusBadge } from '../components/ui/StatusBadge';
import { totalsByCurrency } from '../domain/archive';
import { getTripStats, sortItineraryItems } from '../domain/trips';
import { getTodayTripDay, getTripStatus, type TripStatus } from '../domain/travelMode';
import { formatDateRange, formatDayDate } from '../lib/formatters';
import { useProfile } from '../state/useProfile';
import { useTrips } from '../state/useTrips';
import type { Expense, Purchase } from '../types/archive';
import type { Trip } from '../types/trip';

const statusLabels: Record<TripStatus, string> = { upcoming: '计划中', active: '进行中', completed: '已完成' };
const statusTones = { upcoming: 'amber', active: 'green', completed: 'gray' } as const;

function moneyLines(values: Record<string, number>) {
  const entries = Object.entries(values);
  return entries.length
    ? entries.map(([currency, amount]) => `${currency} ${amount.toLocaleString('zh-CN', { maximumFractionDigits: 2 })}`).join(' · ')
    : '暂无支出';
}

export function OverviewPage() {
  const { trips, selectedTrip, selectTrip, updateTrip, isSaving } = useTrips();
  const { expenses, purchases } = useProfile();
  const [params, setParams] = useSearchParams();
  const [editOpen, setEditOpen] = useState(false);
  const [noteEditor, setNoteEditor] = useState<string | null>(null);
  const [renderedAt] = useState(() => new Date());
  const years = useMemo(() => [...new Set(trips.map((trip) => Number(trip.startDate.slice(0, 4))))].sort((a, b) => b - a), [trips]);
  const selectedTripYear = selectedTrip ? Number(selectedTrip.startDate.slice(0, 4)) : undefined;
  const requestedYear = Number(params.get('year'));
  const selectedYear = years.includes(requestedYear) ? requestedYear : selectedTripYear ?? (years.includes(renderedAt.getFullYear()) ? renderedAt.getFullYear() : years[0]);

  if (!selectedTrip || selectedYear === undefined) return <NoTripState />;

  const annualTrips = trips.filter((trip) => Number(trip.startDate.slice(0, 4)) === selectedYear);
  const counts = annualTrips.reduce<Record<TripStatus, number>>((result, trip) => {
    result[getTripStatus(trip, renderedAt)] += 1;
    return result;
  }, { upcoming: 0, active: 0, completed: 0 });
  const destinations = [...new Set(annualTrips.flatMap((trip) => trip.destinations.map((item) => item.cityName)))];

  function chooseYear(year: number) {
    const next = new URLSearchParams(params);
    next.set('year', String(year));
    setParams(next, { replace: true });
    const firstTrip = trips
      .filter((trip) => Number(trip.startDate.slice(0, 4)) === year)
      .sort((a, b) => b.startDate.localeCompare(a.startDate))[0];
    if (firstTrip) selectTrip(firstTrip.id);
  }

  return <section>
    <PageHeader eyebrow="Year in travel" title="旅行总览" description="先看一整年的旅行，再进入每一趟旅程的规划、进行或回顾。" />

    <div className="mt-6 overflow-x-auto pb-1"><div role="group" aria-label="总览年份" className="flex min-w-max gap-2">{years.map((year) => <button key={year} type="button" aria-pressed={selectedYear === year} onClick={() => chooseYear(year)} className={`rounded-full px-4 py-2 text-sm font-semibold ${selectedYear === year ? 'bg-ink text-white' : 'border border-line bg-white text-muted'}`}>{year}</button>)}</div></div>

    <section aria-label="年度旅行概览" className="mt-5 rounded-3xl bg-ink p-5 text-white shadow-card sm:p-7"><div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-xs font-bold tracking-[0.16em] text-white/45">{selectedYear} YEAR IN TRAVEL</p><h2 className="mt-2 text-3xl font-bold">{annualTrips.length} 趟旅行</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">{destinations.length ? `这一年去往 ${destinations.join('、')}` : '这一年还没有结构化目的地'}</p></div><div className="grid grid-cols-3 gap-2 sm:min-w-[360px]">{(['completed', 'active', 'upcoming'] as const).map((status) => <article key={status} className="rounded-2xl bg-white/8 p-3 text-center"><p className="text-xl font-bold">{counts[status]}</p><p className="mt-1 text-[11px] text-white/55">{statusLabels[status]}</p></article>)}</div></div></section>

    <section aria-label={`${selectedYear}旅行列表`} className="mt-7"><div><p className="text-xs font-bold tracking-[0.14em] text-brand">TRIPS OF THE YEAR</p><h2 className="mt-1 text-xl font-bold">选择一趟旅行查看详情</h2></div><div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{[...annualTrips].sort((a, b) => b.startDate.localeCompare(a.startDate)).map((trip) => <TripOverviewCard key={trip.id} trip={trip} selected={trip.id === selectedTrip.id} expenses={expenses.filter((item) => item.tripId === trip.id)} purchases={purchases.filter((item) => item.tripId === trip.id)} onSelect={() => selectTrip(trip.id)} now={renderedAt} />)}</div></section>

    <TripDetail trip={selectedTrip} expenses={expenses.filter((item) => item.tripId === selectedTrip.id)} purchases={purchases.filter((item) => item.tripId === selectedTrip.id)} now={renderedAt} onEdit={() => setEditOpen(true)} onEditNote={() => setNoteEditor(selectedTrip.travelNote ?? '')} />

    {noteEditor !== null ? <form onSubmit={(event) => { event.preventDefault(); void updateTrip(selectedTrip.id, { travelNote: noteEditor.trim() || null }).then(() => setNoteEditor(null)); }} className="mt-6 rounded-3xl border border-brand/20 bg-white p-5 shadow-card sm:p-7"><label><span className="field-label">旅行备注</span><textarea aria-label="旅行备注" maxLength={10000} value={noteEditor} onChange={(event) => setNoteEditor(event.target.value)} className="field-input min-h-40" /></label><div className="mt-4 flex justify-end gap-3"><button type="button" onClick={() => setNoteEditor(null)} className="min-h-11 rounded-xl border border-line px-5 text-sm font-semibold">取消</button><button disabled={isSaving} className="min-h-11 rounded-xl bg-ink px-5 text-sm font-semibold text-white">保存旅行备注</button></div></form> : null}
    {editOpen ? <EditTripDialog key={selectedTrip.id} trip={selectedTrip} onClose={() => setEditOpen(false)} /> : null}
  </section>;
}

function TripOverviewCard({ trip, selected, expenses, purchases, onSelect, now }: { trip: Trip; selected: boolean; expenses: Expense[]; purchases: Purchase[]; onSelect(): void; now: Date }) {
  const status = getTripStatus(trip, now);
  const stats = getTripStats(trip);
  const today = getTodayTripDay(trip, now);
  const cities = trip.destinations.map((item) => item.cityName).join(' · ') || trip.destination;
  const summary = status === 'completed'
    ? `${stats.totalDays} 天回顾 · ${moneyLines(totalsByCurrency(expenses, purchases))}`
    : status === 'active'
      ? `Day ${today?.dayNumber ?? '—'} / ${stats.totalDays} · 今日 ${today ? trip.itineraryItems.filter((item) => item.tripDayId === today.id).length : 0} 项`
      : `准备 ${stats.preparationPercent}% · 已规划 ${stats.plannedDays} 天`;
  return <button type="button" aria-label={`查看旅行：${trip.name}`} aria-pressed={selected} onClick={onSelect} className={`rounded-2xl border p-5 text-left shadow-card transition-colors ${selected ? 'border-brand bg-brand-soft/60' : 'border-line bg-white hover:border-brand/30'}`}><div className="flex items-center justify-between gap-3"><StatusBadge tone={statusTones[status]}>{statusLabels[status]}</StatusBadge><span className="text-xs text-muted">{trip.startDate.slice(5, 7)}月</span></div><p className="mt-3 text-lg font-bold">{trip.name}</p><p className="mt-1 truncate text-sm text-muted">{cities}</p><p className="mt-4 text-xs font-semibold text-ink">{summary}</p></button>;
}

function TripDetail({ trip, expenses, purchases, now, onEdit, onEditNote }: { trip: Trip; expenses: Expense[]; purchases: Purchase[]; now: Date; onEdit(): void; onEditNote(): void }) {
  const status = getTripStatus(trip, now);
  const stats = getTripStats(trip);
  const today = getTodayTripDay(trip, now);
  const spending = totalsByCurrency(expenses, purchases);
  const cities = trip.destinations.map((item) => item.cityName).join(' · ') || trip.destination;
  const completedItems = trip.itineraryItems.filter((item) => item.status === 'completed').length;
  const recordCount = expenses.length + purchases.length;
  const daysUntil = Math.max(0, Math.ceil((new Date(`${trip.startDate}T00:00:00`).getTime() - now.getTime()) / 86_400_000));
  const metricCards = status === 'completed'
    ? [{ label: '旅行时长', value: `${stats.totalDays} 天`, icon: CalendarDays }, { label: '去过地方', value: `${trip.destinations.length || 1} 个`, icon: MapPinned }, { label: '旅途花费', value: moneyLines(spending), icon: WalletCards }, { label: '花费与购物记录', value: `${recordCount} 条`, icon: FileText }]
    : status === 'active'
      ? [{ label: '当前进度', value: `Day ${today?.dayNumber ?? '—'} / ${stats.totalDays}`, icon: CalendarDays }, { label: '今日行程', value: `${today ? trip.itineraryItems.filter((item) => item.tripDayId === today.id).length : 0} 项`, icon: CalendarCheck2 }, { label: '当前支出', value: moneyLines(spending), icon: WalletCards }, { label: '已留记录', value: `${recordCount} 条`, icon: FileText }]
      : [{ label: '出发倒计时', value: `${daysUntil} 天`, icon: CalendarDays }, { label: '准备完成度', value: `${stats.preparationPercent}%`, icon: CheckCircle2 }, { label: '已规划行程', value: `${stats.plannedDays} / ${stats.totalDays} 天`, icon: Route }, { label: trip.budgetAmount ? '预算 / 当前支出' : '当前支出', value: trip.budgetAmount ? `${trip.budgetCurrency} ${trip.budgetAmount.toLocaleString('zh-CN')} · ${moneyLines(spending)}` : moneyLines(spending), icon: WalletCards }];

  return <section aria-label="单趟旅行详情" className="mt-9 border-t border-line pt-8"><header className="rounded-3xl bg-white p-5 shadow-card sm:p-7"><div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><StatusBadge tone={statusTones[status]}>{statusLabels[status]}</StatusBadge><span className="text-xs text-muted">{trip.departureLocation} → {cities}</span></div><h2 className="mt-3 text-3xl font-bold tracking-tight">{trip.name}</h2><p className="mt-2 text-sm text-muted">{formatDateRange(trip.startDate, trip.endDate)} · {stats.totalDays} 天</p></div><div className="flex flex-wrap gap-2">{status === 'active' ? <Link to="/today" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white"><CalendarCheck2 className="size-4"/>进入今天</Link> : null}<button type="button" onClick={onEdit} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line px-4 text-sm font-semibold"><Settings2 className="size-4"/>编辑旅行</button></div></div></header><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{metricCards.map(({ label, value, icon: Icon }) => <article key={label} className="rounded-2xl border border-line bg-white p-5 shadow-card"><Icon className="size-5 text-brand"/><p className="mt-4 text-xs text-muted">{label}</p><p className="mt-1 break-words text-lg font-bold">{value}</p></article>)}</div><div className="mt-5 grid gap-5 lg:grid-cols-[1.35fr_0.65fr]"><StatusWorkspace trip={trip} status={status} today={today} completedItems={completedItems}/><button type="button" aria-label="查看和编辑旅行备注" onClick={onEditNote} className="rounded-3xl bg-brand-soft p-6 text-left shadow-card"><div className="flex items-center justify-between"><div><p className="text-xs font-bold tracking-[0.14em] text-brand">TRIP NOTE</p><h3 className="mt-2 text-lg font-bold">旅行备注</h3></div><Pencil className="size-4 text-brand"/></div>{trip.travelNote ? <p className="mt-5 line-clamp-5 whitespace-pre-wrap text-sm leading-7">{trip.travelNote}</p> : <div className="mt-6 flex items-center gap-3 rounded-2xl border border-dashed border-brand/25 p-4 text-sm font-semibold text-brand"><FileText className="size-5"/>添加旅行备注</div>}</button></div></section>;
}

function StatusWorkspace({ trip, status, today, completedItems }: { trip: Trip; status: TripStatus; today: ReturnType<typeof getTodayTripDay>; completedItems: number }) {
  const sorted = sortItineraryItems(trip.itineraryItems);
  const visibleItems = status === 'active' && today ? sorted.filter((item) => item.tripDayId === today.id) : sorted.slice(0, 4);
  const title = status === 'completed' ? '行程回顾' : status === 'active' ? '今日旅途' : '下一步规划';
  const description = status === 'completed' ? `共留下 ${trip.itineraryItems.length} 项行程，其中 ${completedItems} 项已完成。` : status === 'active' ? '把注意力放在今天，完整计划仍可随时查看。' : `已准备 ${trip.preparationItems.filter((item) => item.completed).length} / ${trip.preparationItems.length} 项，继续补齐行程。`;
  return <article className="rounded-3xl border border-line bg-white p-6 shadow-card sm:p-7"><p className="text-xs font-bold tracking-[0.14em] text-brand">{status === 'completed' ? 'LOOK BACK' : status === 'active' ? 'ON THE ROAD' : 'PLAN AHEAD'}</p><h3 className="mt-2 text-xl font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted">{description}</p>{visibleItems.length ? <ol className="mt-5 space-y-3">{visibleItems.map((item) => { const day = trip.days.find((candidate) => candidate.id === item.tripDayId); return <li key={item.id} className="flex gap-3 rounded-2xl bg-canvas p-3"><span className="shrink-0 text-xs font-bold text-brand">{day ? `D${day.dayNumber}` : '—'}</span><div className="min-w-0"><p className="truncate text-sm font-semibold">{item.time ?? '灵活时间'} · {item.placeName}</p><p className="mt-1 text-xs text-muted">{status === 'completed' ? item.status === 'completed' ? '旅途中已完成' : item.status === 'skipped' ? '旅途中已跳过' : '未标记完成' : day ? formatDayDate(day.date) : ''}</p></div></li>; })}</ol> : <p className="mt-5 rounded-2xl bg-canvas p-5 text-sm text-muted">还没有行程安排。</p>}<div className="mt-6 flex flex-wrap gap-3">{status === 'upcoming' ? <Link to="/preparation" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand">继续准备 <ArrowUpRight className="size-4"/></Link> : null}{status === 'active' ? <Link to="/today" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand">打开 Today <ArrowUpRight className="size-4"/></Link> : null}<Link to="/itinerary" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand">{status === 'completed' ? '查看完整回顾' : '查看完整行程'} <ArrowUpRight className="size-4"/></Link><Link to="/archive" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand">{status === 'completed' ? '整理旅行记录' : '查看记录'} <ArrowUpRight className="size-4"/></Link></div></article>;
}
