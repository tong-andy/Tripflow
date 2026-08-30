import { ArrowRight, CalendarDays, MapPin, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { NoTripState } from '../components/ui/NoTripState';
import { StatusBadge } from '../components/ui/StatusBadge';
import type { AppShellContext } from '../layouts/AppShell';
import { formatDateRange } from '../lib/formatters';
import { useTrips } from '../state/useTrips';
import { getTripStatus } from '../domain/travelMode';

const tripStatusLabels = { upcoming: '即将出发', active: '旅行中', completed: '已完成' } as const;

export function TripsPage() {
  const { trips, selectTrip, deleteTrip, isSaving } = useTrips();
  const { openNewTrip } = useOutletContext<AppShellContext>();
  const [deletingTripId, setDeletingTripId] = useState<string>();
  const deletingTrip = trips.find((trip) => trip.id === deletingTripId);

  return (
    <section>
      <PageHeader
        eyebrow="Trip workspace"
        title="我的旅行"
        description="集中查看正在准备、即将出发和已经结束的旅程。"
        action={
          <button
            type="button"
            onClick={openNewTrip}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white sm:hidden"
          >
            <Plus className="size-4" />
            新建旅行
          </button>
        }
      />

      {trips.length === 0 ? (
        <div className="mt-8">
          <NoTripState onCreate={openNewTrip} />
        </div>
      ) : (
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {trips.map((trip, index) => (
          <article
            key={trip.id}
            className="group overflow-hidden rounded-3xl border border-line bg-white shadow-card"
          >
            <div className={`${index % 2 === 0 ? 'bg-[#dce9df]' : 'bg-[#dce8ed]'} flex h-32 items-end p-6 sm:h-36`}>
              <div className="flex w-full items-center justify-between">
                <div className="grid size-12 place-items-center rounded-2xl bg-white/70 text-2xl backdrop-blur-sm">
                  ✦
                </div>
                <StatusBadge tone={getTripStatus(trip) === 'active' ? 'green' : 'gray'}>
                  {tripStatusLabels[getTripStatus(trip)]}
                </StatusBadge>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-ink">
                    {trip.name}
                  </h2>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                    <MapPin className="size-3.5" />
                    {trip.departureLocation} → {trip.destination}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    aria-label={`删除旅行：${trip.name}`}
                    disabled={isSaving}
                    onClick={() => setDeletingTripId(trip.id)}
                    className="grid size-10 shrink-0 place-items-center rounded-full border border-line text-muted hover:border-red-200 hover:text-red-600"
                  >
                    <Trash2 className="size-4" />
                  </button>
                  <Link
                    to={getTripStatus(trip)==='active'?'/today':'/overview'}
                    onClick={() => selectTrip(trip.id)}
                    aria-label={`查看${trip.name}${getTripStatus(trip)==='active'?'今天':'总览'}`}
                    className="grid size-10 shrink-0 place-items-center rounded-full border border-line text-muted transition-colors group-hover:border-ink group-hover:text-ink md:hidden"
                  >
                    <ArrowRight className="size-4" />
                  </Link>
                  <Link to="/overview" onClick={() => selectTrip(trip.id)} aria-label={`查看${trip.name}总览`} className="hidden size-10 shrink-0 place-items-center rounded-full border border-line text-muted transition-colors group-hover:border-ink group-hover:text-ink md:grid"><ArrowRight className="size-4" /></Link>
                </div>
              </div>
              <div className="mt-6 flex items-center gap-4 border-t border-line pt-4 text-xs font-medium text-muted">
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="size-3.5" />
                  {formatDateRange(trip.startDate, trip.endDate)}
                </span>
                <span>{trip.days.length} 天</span>
              </div>
            </div>
          </article>
        ))}
      </div>
      )}

      {trips.length > 0 ? <button
        type="button"
        onClick={openNewTrip}
        className="mt-5 hidden w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-line bg-white/60 px-4 py-5 text-sm font-semibold text-muted hover:border-brand hover:text-brand sm:flex"
      >
        <Plus className="size-4" />
        规划一段新旅行
      </button> : null}

      <ConfirmDialog
        open={Boolean(deletingTrip)}
        title="删除旅行？"
        description={`“${deletingTrip?.name ?? ''}”及其准备事项和每日行程都会删除，此操作无法恢复。`}
        busy={isSaving}
        onCancel={() => setDeletingTripId(undefined)}
        onConfirm={() => {
          if (!deletingTrip) return;
          void deleteTrip(deletingTrip.id)
            .then(() => setDeletingTripId(undefined))
            .catch(() => undefined);
        }}
      />
    </section>
  );
}
