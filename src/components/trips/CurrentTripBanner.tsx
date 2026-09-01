import { CalendarDays, MapPin } from 'lucide-react';
import { StatusBadge } from '../ui/StatusBadge';
import { getTripStatus } from '../../domain/travelMode';
import { formatDateRange } from '../../lib/formatters';
import type { Trip } from '../../types/trip';

const statusLabels = {
  upcoming: '计划中',
  active: '进行中',
  completed: '已完成',
} as const;

export function CurrentTripBanner({ trip }: { trip: Trip }) {
  const status = getTripStatus(trip);
  const destinations = trip.destinations
    .map((destination) => destination.cityName)
    .join(' · ') || trip.destination;

  return (
    <aside aria-label="当前旅行信息" className="mt-6 rounded-2xl border border-brand/15 bg-brand-soft/55 px-4 py-4 sm:px-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold tracking-[0.15em] text-brand">CURRENT TRIP</span>
            <StatusBadge tone={status === 'active' ? 'green' : status === 'upcoming' ? 'amber' : 'gray'}>
              {statusLabels[status]}
            </StatusBadge>
          </div>
          <p className="mt-2 truncate text-lg font-bold text-ink">{trip.name}</p>
        </div>
        <div className="grid gap-1.5 text-xs text-muted sm:text-right">
          <span className="inline-flex items-center gap-1.5 sm:justify-end"><MapPin className="size-3.5 text-brand" />{destinations}</span>
          <span className="inline-flex items-center gap-1.5 sm:justify-end"><CalendarDays className="size-3.5 text-brand" />{formatDateRange(trip.startDate, trip.endDate)} · {trip.days.length} 天</span>
        </div>
      </div>
    </aside>
  );
}
