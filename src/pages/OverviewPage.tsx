import { ArrowUpRight, CalendarCheck2, CalendarDays, CheckCircle2, Route } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { NoTripState } from '../components/ui/NoTripState';
import { getTripStats, sortItineraryItems } from '../domain/trips';
import { formatDateRange, formatDayDate } from '../lib/formatters';
import { useTrips } from '../state/useTrips';
import { getTripStatus } from '../domain/travelMode';

export function OverviewPage() {
  const { selectedTrip, updateTrip, isSaving } = useTrips();
  const [timezoneOpen, setTimezoneOpen] = useState(false);
  const [timezone, setTimezone] = useState(selectedTrip?.timezone ?? 'Asia/Shanghai');

  if (!selectedTrip) {
    return <NoTripState />;
  }

  const stats = getTripStats(selectedTrip);
  const nextItem = sortItineraryItems(selectedTrip.itineraryItems)[0];
  const nextItemDay = selectedTrip.days.find(
    (day) => day.id === nextItem?.tripDayId,
  );
  const statCards = [
    {
      label: '旅行日期',
      value: `${stats.totalDays} 天`,
      detail: formatDateRange(selectedTrip.startDate, selectedTrip.endDate),
      icon: CalendarDays,
    },
    {
      label: '准备进度',
      value: `${stats.preparationPercent}%`,
      detail: `${stats.preparationCompleted} / ${stats.preparationTotal} 项完成`,
      icon: CheckCircle2,
    },
    {
      label: '已规划行程',
      value: `${stats.plannedDays} 天`,
      detail: `共 ${stats.totalDays} 个旅行日`,
      icon: Route,
    },
  ];

  return (
    <section>
      <PageHeader
        eyebrow={`${selectedTrip.departureLocation} → ${selectedTrip.destination}`}
        title="旅行总览"
        description={`${selectedTrip.name} · ${formatDateRange(selectedTrip.startDate, selectedTrip.endDate)}`}
        action={<div className="flex flex-wrap gap-2">{getTripStatus(selectedTrip)==='active'?<Link replace to="/today" className="inline-flex items-center gap-2 rounded-xl bg-brand-soft px-4 py-2.5 text-sm font-semibold text-brand"><CalendarCheck2 className="size-4"/>进入今天</Link>:null}<button type="button" onClick={()=>{setTimezone(selectedTrip.timezone);setTimezoneOpen(!timezoneOpen)}} className="rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold">时区：{selectedTrip.timezone}</button></div>}
      />

      {timezoneOpen?<form onSubmit={event=>{event.preventDefault();void updateTrip(selectedTrip.id,{timezone}).then(()=>setTimezoneOpen(false)).catch(()=>undefined)}} className="mt-5 flex flex-col gap-3 rounded-2xl border border-brand/20 bg-brand-soft/50 p-4 sm:flex-row sm:items-end"><label className="flex-1"><span className="field-label">旅行目的地 IANA timezone</span><input aria-label="旅行时区" required value={timezone} onChange={event=>setTimezone(event.target.value)} className="field-input" placeholder="Asia/Tokyo"/></label><button disabled={isSaving} className="rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-white">{isSaving?'保存中…':'保存时区'}</button></form>:null}

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {statCards.map(({ label, value, detail, icon: Icon }) => (
          <article key={label} className="rounded-2xl border border-line bg-white p-5 shadow-card">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted">{label}</p>
              <Icon className="size-[18px] text-brand" />
            </div>
            <p className="mt-5 text-2xl font-bold tracking-tight text-ink">{value}</p>
            <p className="mt-1 text-xs text-muted">{detail}</p>
          </article>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <article className="rounded-3xl border border-line bg-white p-6 shadow-card sm:p-7">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand">Next up</p>
              <h2 className="mt-2 text-xl font-bold text-ink">
                {nextItem?.placeName ?? '还没有行程安排'}
              </h2>
            </div>
            {nextItemDay ? (
              <span className="rounded-full bg-brand-soft px-3 py-1.5 text-xs font-semibold text-brand">
                DAY {String(nextItemDay.dayNumber).padStart(2, '0')}
              </span>
            ) : null}
          </div>
          <div className="mt-8 border-l-2 border-brand-soft pl-5">
            <p className="text-sm font-semibold text-ink">
              {nextItem && nextItemDay
                ? `${nextItem.time ?? '灵活时间'} · ${formatDayDate(nextItemDay.date)}`
                : '从每日行程开始规划第一站'}
            </p>
            <p className="mt-1 text-sm leading-6 text-muted">
              {nextItem?.notes || '添加地点、时间和停留时长后，会在这里显示下一项安排。'}
            </p>
          </div>
          <Link to="/itinerary" className="mt-7 inline-flex items-center gap-1.5 text-sm font-semibold text-brand">
            查看完整行程 <ArrowUpRight className="size-4" />
          </Link>
        </article>

        <article className="rounded-3xl bg-ink p-6 text-white shadow-card sm:p-7">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/55">Travel note</p>
          <blockquote className="mt-5 text-xl font-medium leading-8 tracking-tight">
            “从 {selectedTrip.departureLocation} 出发，去 {selectedTrip.destination} 看看。”
          </blockquote>
          <p className="mt-8 text-xs text-white/55">{selectedTrip.name} · 旅行备忘</p>
        </article>
      </div>
    </section>
  );
}
