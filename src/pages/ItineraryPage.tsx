import { ArrowLeft, Clock3, MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { ItineraryItemForm } from '../components/itinerary/ItineraryItemForm';
import { PageHeader } from '../components/ui/PageHeader';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { NoTripState } from '../components/ui/NoTripState';
import { sortItineraryItems } from '../domain/trips';
import { formatDayDate, formatDuration } from '../lib/formatters';
import { useTrips } from '../state/useTrips';
import type { ItineraryItem, ItineraryStatus } from '../types/trip';

const statusLabels: Record<ItineraryStatus, string> = {
  planned: '计划中',
  completed: '已完成',
  skipped: '已跳过',
};

const statusClasses: Record<ItineraryStatus, string> = {
  planned: 'bg-amber-50 text-amber-700',
  completed: 'bg-emerald-50 text-emerald-700',
  skipped: 'bg-stone-100 text-stone-500',
};

export function ItineraryPage() {
  const {
    selectedTrip,
    addItineraryItem,
    updateItineraryItem,
    updateItineraryStatus,
    deleteItineraryItem,
    isSaving,
  } = useTrips();
  const [selectedDayId, setSelectedDayId] = useState(
    selectedTrip?.days[0]?.id ?? '',
  );
  const [formOpen, setFormOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<ItineraryItem>();
  const [editingItem, setEditingItem] = useState<ItineraryItem>();

  if (!selectedTrip) {
    return <NoTripState />;
  }

  const selectedDay =
    selectedTrip.days.find((day) => day.id === selectedDayId) ??
    selectedTrip.days[0];
  const items = selectedDay
    ? sortItineraryItems(
        selectedTrip.itineraryItems.filter(
          (item) => item.tripDayId === selectedDay.id,
        ),
      )
    : [];

  return (
    <section>
      <PageHeader
        eyebrow={`${selectedTrip.days.length} days · ${selectedTrip.destination}`}
        title="行程"
        description="按天查看旅行安排，保持节奏清晰，也给临时变化留出空间。"
        action={
          <button
            type="button"
            disabled={isSaving}
            onClick={() => setFormOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white"
          >
            <Plus className="size-4" /> 添加安排
          </button>
        }
      />

      <div className="-mx-5 mt-8 overflow-x-auto px-5 pb-2 sm:-mx-8 sm:px-8 lg:-mx-10 lg:px-10">
        <div className="flex min-w-max gap-2">
          {selectedTrip.days.map((day) => {
            const itemCount = selectedTrip.itineraryItems.filter(
              (item) => item.tripDayId === day.id,
            ).length;
            const active = day.id === selectedDay?.id;

            return (
              <button
                key={day.id}
                type="button"
                onClick={() => {
                  setSelectedDayId(day.id);
                  setFormOpen(false);
                }}
                className={`min-w-28 rounded-2xl border px-4 py-3 text-left ${active ? 'border-brand bg-brand text-white' : 'border-line bg-white text-ink'}`}
              >
                <span className={`block text-[11px] font-bold tracking-wide ${active ? 'text-white/70' : 'text-muted'}`}>
                  DAY {String(day.dayNumber).padStart(2, '0')}
                </span>
                <span className="mt-1 block text-sm font-semibold">
                  {formatDayDate(day.date)}
                </span>
                <span className={`mt-1 block text-[11px] ${active ? 'text-white/70' : 'text-muted'}`}>
                  {itemCount} 项安排
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {formOpen && selectedDay ? (
        <ItineraryItemForm
          key={selectedDay.id}
          day={selectedDay}
          onCancel={() => setFormOpen(false)}
          onSubmit={async (input) => {
            await addItineraryItem(input);
            setFormOpen(false);
          }}
        />
      ) : null}

      <div className="mt-6 rounded-3xl border border-line bg-white p-5 shadow-card sm:p-7">
        <div className="flex items-center justify-between gap-4 border-b border-line pb-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand">
              DAY {String(selectedDay?.dayNumber ?? 0).padStart(2, '0')}
            </p>
            <h2 className="mt-1 text-xl font-bold text-ink">
              {selectedDay ? formatDayDate(selectedDay.date) : '未选择日期'}
            </h2>
          </div>
          <span className="text-xs font-semibold text-muted">{items.length} 项安排</span>
        </div>

        {items.length > 0 ? (
          <ol className="mt-2 divide-y divide-line">
            {items.map((item) => (
              <li key={item.id} className="grid gap-3 py-5 sm:grid-cols-[72px_1fr_auto] sm:items-start">
                <p className="text-lg font-bold tabular-nums text-ink">{item.time ?? '灵活'}</p>
                <div>
                  <p className="flex items-center gap-1.5 font-semibold text-ink">
                    <MapPin className="size-4 text-brand" />
                    {item.placeName}
                  </p>
                  <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-muted">
                    <Clock3 className="size-3.5" />
                    预计停留 {formatDuration(item.durationMinutes)}
                  </p>
                  {item.address ? <p className="mt-2 text-xs text-muted">{item.address}</p> : null}
                  {item.notes ? (
                    <p className="mt-2 text-sm leading-6 text-muted">{item.notes}</p>
                  ) : null}
                </div>
                <div className="flex items-center gap-2 sm:justify-end">
                <label className="sm:text-right">
                  <span className="sr-only">更新 {item.placeName} 状态</span>
                  <select
                    aria-label={`${item.placeName}状态`}
                    value={item.status}
                    disabled={isSaving}
                    onChange={(event) =>
                      void updateItineraryStatus(
                        item.id,
                        event.target.value as ItineraryStatus,
                      ).catch(() => undefined)
                    }
                    className={`rounded-full border-0 px-3 py-1.5 text-xs font-semibold outline-none ${statusClasses[item.status]}`}
                  >
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  disabled={isSaving}
                  aria-label={`编辑行程：${item.placeName}`}
                  onClick={() => setEditingItem(item)}
                  className="grid size-8 place-items-center rounded-lg text-muted hover:bg-brand-soft hover:text-brand"
                >
                  <Pencil className="size-3.5" />
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  aria-label={`删除行程：${item.placeName}`}
                  onClick={() => setDeletingItem(item)}
                  className="grid size-8 place-items-center rounded-lg text-muted hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="size-3.5" />
                </button>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <div className="py-12 text-center">
            <p className="font-semibold text-ink">这一天还没有安排</p>
            <p className="mt-1 text-sm text-muted">添加第一项地点和时间，开始规划当天路线。</p>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => setFormOpen(true)}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white"
            >
              <Plus className="size-4" /> 添加安排
            </button>
          </div>
        )}
      </div>

      {editingItem && selectedDay ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-canvas md:grid md:place-items-center md:bg-ink/35 md:p-8">
          <section aria-label={`编辑行程：${editingItem.placeName}`} className="min-h-dvh bg-canvas px-5 pb-10 pt-[max(1rem,env(safe-area-inset-top))] md:min-h-0 md:w-full md:max-w-3xl md:rounded-3xl md:p-7">
            <button type="button" onClick={() => setEditingItem(undefined)} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-semibold text-ink">
              <ArrowLeft className="size-4" /> 返回行程
            </button>
            <div className="mt-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand">Edit itinerary</p>
              <h2 className="mt-2 text-2xl font-bold">编辑行程</h2>
            </div>
            <ItineraryItemForm
              key={editingItem.id}
              day={selectedTrip.days.find((day) => day.id === editingItem.tripDayId) ?? selectedDay}
              item={editingItem}
              onCancel={() => setEditingItem(undefined)}
              onSubmit={async (input) => {
                await updateItineraryItem(editingItem.id, input);
                setEditingItem(undefined);
              }}
            />
          </section>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(deletingItem)}
        title="删除行程安排？"
        description={`“${deletingItem?.placeName ?? ''}”删除后无法恢复。`}
        busy={isSaving}
        onCancel={() => setDeletingItem(undefined)}
        onConfirm={() => {
          if (!deletingItem) return;
          void deleteItineraryItem(deletingItem.id)
            .then(() => setDeletingItem(undefined))
            .catch(() => undefined);
        }}
      />
    </section>
  );
}
