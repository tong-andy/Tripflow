import { ArrowUpRight, CalendarCheck2, CalendarDays, CheckCircle2, ChevronDown, FileText, Pencil, Route, Settings2, WalletCards } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { EditTripDialog } from '../components/trips/EditTripDialog';
import { NoTripState } from '../components/ui/NoTripState';
import { StatusBadge } from '../components/ui/StatusBadge';
import { totalsByCurrency } from '../domain/archive';
import { getTripStats, sortItineraryItems } from '../domain/trips';
import { getTodayTripDay, getTripStatus } from '../domain/travelMode';
import { formatDateRange, formatDayDate } from '../lib/formatters';
import { useProfile } from '../state/useProfile';
import { useTrips } from '../state/useTrips';

const statusLabels = { upcoming: '即将出发', active: '旅行中', completed: '已完成' } as const;

export function OverviewPage() {
  const { trips, selectedTrip, selectTrip, updateTrip, isSaving } = useTrips();
  const { expenses, purchases } = useProfile();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [noteEditor, setNoteEditor] = useState<string | null>(null);
  const [renderedAt] = useState(() => new Date());

  if (!selectedTrip) return <NoTripState />;

  const status = getTripStatus(selectedTrip);
  const stats = getTripStats(selectedTrip);
  const todayDay = getTodayTripDay(selectedTrip);
  const nextItem = sortItineraryItems(selectedTrip.itineraryItems).find((item) => item.status === 'planned');
  const nextItemDay = selectedTrip.days.find((day) => day.id === nextItem?.tripDayId);
  const spending = totalsByCurrency(
    expenses.filter((item) => item.tripId === selectedTrip.id),
    purchases.filter((item) => item.tripId === selectedTrip.id),
  );
  const cities = selectedTrip.destinations.map((destination) => destination.cityName).join(' · ') || selectedTrip.destination;
  const recentTrips = [...trips].sort((a, b) => b.startDate.localeCompare(a.startDate)).slice(0, 5);
  const todayNumber = todayDay?.dayNumber;
  const daysUntil = Math.max(0, Math.ceil((new Date(`${selectedTrip.startDate}T00:00:00`).getTime() - renderedAt.getTime()) / 86_400_000));

  return (
    <section>
      <header className="rounded-3xl bg-ink p-5 text-white shadow-card sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2"><StatusBadge tone={status === 'active' ? 'green' : status === 'upcoming' ? 'amber' : 'gray'}>{statusLabels[status]}</StatusBadge><span className="text-xs text-white/55">{selectedTrip.departureLocation} → {cities}</span></div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">{selectedTrip.name}</h1>
            <p className="mt-2 text-sm text-white/65">{formatDateRange(selectedTrip.startDate, selectedTrip.endDate)} · {stats.totalDays} 天</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {status === 'active' ? <Link to="/today" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white"><CalendarCheck2 className="size-4" />进入今天</Link> : null}
            <button type="button" onClick={() => setEditOpen(true)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white/10 px-4 text-sm font-semibold"><Settings2 className="size-4" />编辑旅行</button>
          </div>
        </div>

        <div className="relative mt-6 border-t border-white/10 pt-5">
          <button type="button" aria-expanded={switcherOpen} onClick={() => setSwitcherOpen((open) => !open)} className="flex min-h-11 w-full items-center justify-between rounded-xl bg-white/8 px-4 text-left sm:max-w-sm"><span><span className="block text-[10px] font-bold tracking-wide text-white/45">当前旅行</span><span className="text-sm font-semibold">{selectedTrip.name}</span></span><ChevronDown className={`size-4 transition-transform ${switcherOpen ? 'rotate-180' : ''}`} /></button>
          {switcherOpen ? <div className="absolute left-0 top-full z-30 mt-2 w-full max-w-sm rounded-2xl border border-line bg-white p-2 text-ink shadow-xl">{recentTrips.map((trip) => <button key={trip.id} type="button" onClick={() => { selectTrip(trip.id); setSwitcherOpen(false); }} className={`block min-h-14 w-full rounded-xl px-3 py-2 text-left ${trip.id === selectedTrip.id ? 'bg-brand-soft' : 'hover:bg-canvas'}`}><span className="block text-sm font-semibold">{trip.name}</span><span className="mt-0.5 block text-xs text-muted">{formatDateRange(trip.startDate, trip.endDate)} · {statusLabels[getTripStatus(trip)]}</span></button>)}<button type="button" onClick={() => void navigate('/trips')} className="mt-1 min-h-11 w-full border-t border-line px-3 text-left text-sm font-semibold text-brand">查看全部旅行 →</button></div> : null}
        </div>
      </header>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-2xl border border-line bg-white p-5 shadow-card"><CalendarDays className="size-5 text-brand" /><p className="mt-4 text-xs text-muted">{status === 'active' ? '当前进度' : status === 'upcoming' ? '出发倒计时' : '旅行时长'}</p><p className="mt-1 text-2xl font-bold">{status === 'active' ? `Day ${todayNumber ?? '—'} / ${stats.totalDays}` : status === 'upcoming' ? `${daysUntil} 天` : `${stats.totalDays} 天`}</p></article>
        <article className="rounded-2xl border border-line bg-white p-5 shadow-card"><CheckCircle2 className="size-5 text-brand" /><p className="mt-4 text-xs text-muted">准备完成度</p><p className="mt-1 text-2xl font-bold">{stats.preparationPercent}%</p><p className="mt-1 text-xs text-muted">{stats.preparationCompleted} / {stats.preparationTotal} 项</p></article>
        <article className="rounded-2xl border border-line bg-white p-5 shadow-card"><Route className="size-5 text-brand" /><p className="mt-4 text-xs text-muted">已规划行程</p><p className="mt-1 text-2xl font-bold">{stats.plannedDays} 天</p><p className="mt-1 text-xs text-muted">共 {selectedTrip.itineraryItems.length} 项安排</p></article>
        <article className="rounded-2xl border border-line bg-white p-5 shadow-card"><WalletCards className="size-5 text-brand" /><p className="mt-4 text-xs text-muted">{selectedTrip.budgetAmount ? '预算 / 当前支出' : '当前支出'}</p>{Object.keys(spending).length ? Object.entries(spending).map(([currency, amount]) => <p key={currency} className="mt-1 text-lg font-bold">{currency} {amount.toLocaleString('zh-CN', { maximumFractionDigits: 2 })}{selectedTrip.budgetCurrency === currency && selectedTrip.budgetAmount ? ` / ${selectedTrip.budgetAmount.toLocaleString('zh-CN')}` : ''}</p>) : <p className="mt-1 text-2xl font-bold">暂无</p>}</article>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <article className="rounded-3xl border border-line bg-white p-6 shadow-card sm:p-7"><p className="text-xs font-bold tracking-[0.14em] text-brand">{status === 'active' ? 'TODAY / NEXT' : 'NEXT UP'}</p><h2 className="mt-2 text-xl font-bold">{nextItem?.placeName ?? '还没有行程安排'}</h2><div className="mt-6 border-l-2 border-brand-soft pl-5"><p className="text-sm font-semibold">{nextItem && nextItemDay ? `${nextItem.time ?? '灵活时间'} · ${formatDayDate(nextItemDay.date)}` : '从每日行程开始规划第一站'}</p><p className="mt-1 text-sm leading-6 text-muted">{nextItem?.notes || '添加地点、时间和停留时长后，会在这里显示下一项安排。'}</p></div><Link to="/itinerary" className="mt-7 inline-flex items-center gap-1.5 text-sm font-semibold text-brand">查看完整行程 <ArrowUpRight className="size-4" /></Link></article>
        <button type="button" aria-label="查看和编辑旅行备注" onClick={() => setNoteEditor(selectedTrip.travelNote ?? '')} className="group rounded-3xl bg-brand-soft p-6 text-left shadow-card sm:p-7"><div className="flex items-center justify-between"><div><p className="text-xs font-bold tracking-[0.14em] text-brand">TRIP NOTE</p><h2 className="mt-2 text-lg font-bold">旅行备注</h2></div><Pencil className="size-4 text-brand" /></div>{selectedTrip.travelNote ? <p className="mt-5 line-clamp-5 whitespace-pre-wrap text-sm leading-7">{selectedTrip.travelNote}</p> : <div className="mt-6 flex items-center gap-3 rounded-2xl border border-dashed border-brand/25 p-4 text-sm font-semibold text-brand"><FileText className="size-5" />添加旅行备注</div>}</button>
      </div>

      {noteEditor !== null ? <form onSubmit={(event) => { event.preventDefault(); void updateTrip(selectedTrip.id, { travelNote: noteEditor.trim() || null }).then(() => setNoteEditor(null)); }} className="mt-6 rounded-3xl border border-brand/20 bg-white p-5 shadow-card sm:p-7"><label><span className="field-label">旅行备注</span><textarea aria-label="旅行备注" maxLength={10000} value={noteEditor} onChange={(event) => setNoteEditor(event.target.value)} className="field-input min-h-40" /></label><div className="mt-4 flex justify-end gap-3"><button type="button" onClick={() => setNoteEditor(null)} className="min-h-11 rounded-xl border border-line px-5 text-sm font-semibold">取消</button><button disabled={isSaving} className="min-h-11 rounded-xl bg-ink px-5 text-sm font-semibold text-white">保存旅行备注</button></div></form> : null}

      {editOpen ? <EditTripDialog key={selectedTrip.id} trip={selectedTrip} onClose={() => setEditOpen(false)} /> : null}
    </section>
  );
}
