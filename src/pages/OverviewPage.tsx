import { ArrowUpRight, CalendarCheck2, CalendarDays, CheckCircle2, FileText, Pencil, Route } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { NoTripState } from '../components/ui/NoTripState';
import { getTripStats, sortItineraryItems } from '../domain/trips';
import { formatDateRange, formatDayDate } from '../lib/formatters';
import { useTrips } from '../state/useTrips';
import { getTripStatus } from '../domain/travelMode';
import { TimezoneCombobox } from '../components/ui/TimezoneCombobox';
import { timezoneLabel } from '../domain/timezones';

export function OverviewPage() {
  const { selectedTrip, updateTrip, isSaving } = useTrips();
  const [timezoneOpen, setTimezoneOpen] = useState(false);
  const [timezone, setTimezone] = useState(selectedTrip?.timezone ?? 'Asia/Shanghai');
  const [noteEditor, setNoteEditor] = useState<{ tripId: string; draft: string } | null>(null);

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
        action={<div className="flex flex-wrap gap-2">{getTripStatus(selectedTrip)==='active'?<Link replace to="/today" className="inline-flex items-center gap-2 rounded-xl bg-brand-soft px-4 py-2.5 text-sm font-semibold text-brand"><CalendarCheck2 className="size-4"/>进入今天</Link>:null}<button type="button" onClick={()=>{setTimezone(selectedTrip.timezone);setTimezoneOpen(!timezoneOpen)}} className="rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold">时区：{timezoneLabel(selectedTrip.timezone)}</button></div>}
      />

      {timezoneOpen?<form onSubmit={event=>{event.preventDefault();void updateTrip(selectedTrip.id,{timezone}).then(()=>setTimezoneOpen(false)).catch(()=>undefined)}} className="mt-5 flex flex-col gap-3 rounded-2xl border border-brand/20 bg-brand-soft/50 p-4 sm:flex-row sm:items-end"><div className="min-w-0 flex-1"><TimezoneCombobox label="旅行时区" value={timezone} onChange={setTimezone}/></div><button disabled={isSaving} className="min-h-11 rounded-xl bg-ink px-5 text-sm font-semibold text-white">{isSaving?'保存中…':'保存时区'}</button></form>:null}

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

        <button type="button" aria-label="查看和编辑旅行备注" onClick={()=>setNoteEditor({tripId:selectedTrip.id,draft:selectedTrip.travelNote??''})} className="group rounded-3xl bg-ink p-6 text-left text-white shadow-card sm:p-7">
          <div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-white/55">Trip note</p><h2 className="mt-2 text-lg font-bold">旅行备注</h2></div><span className="grid size-9 place-items-center rounded-full bg-white/10 text-white/70 group-hover:bg-white/15 group-hover:text-white"><Pencil className="size-4"/></span></div>
          {selectedTrip.travelNote?<p className="mt-5 line-clamp-4 whitespace-pre-wrap text-base leading-7 text-white/85">{selectedTrip.travelNote}</p>:<div className="mt-6 flex items-center gap-3 rounded-2xl border border-dashed border-white/20 p-4 text-sm font-semibold text-white/70"><FileText className="size-5"/>添加旅行备注</div>}
          <p className="mt-7 text-xs text-white/45">记录整趟旅行需要随时记住的信息</p>
        </button>
      </div>

      {noteEditor?.tripId===selectedTrip.id?<form aria-label="编辑旅行备注" onSubmit={event=>{event.preventDefault();void updateTrip(noteEditor.tripId,{travelNote:noteEditor.draft||null}).then(()=>setNoteEditor(null)).catch(()=>undefined)}} className="mt-6 rounded-3xl border border-brand/20 bg-white p-5 shadow-card sm:p-7"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold text-brand">TRIP NOTE</p><h2 className="mt-1 text-xl font-bold">编辑旅行备注</h2><p className="mt-1 text-sm text-muted">旅行目标、重要提醒、主题或任何需要随时查看的信息。</p></div><button type="button" onClick={()=>setNoteEditor(null)} className="text-sm font-semibold text-muted">关闭</button></div><label className="mt-5 block"><span className="field-label">备注内容</span><textarea aria-label="旅行备注" maxLength={10000} value={noteEditor.draft} onChange={event=>setNoteEditor({...noteEditor,draft:event.target.value})} className="field-input min-h-44" placeholder="写下这趟旅行最重要的信息……"/></label><div className="mt-4 flex items-center justify-between gap-3"><span className="text-xs text-muted">{noteEditor.draft.length} / 10000</span><button disabled={isSaving} className="min-h-11 rounded-xl bg-ink px-5 text-sm font-semibold text-white disabled:opacity-50">{isSaving?'保存中…':'保存旅行备注'}</button></div></form>:null}
    </section>
  );
}
