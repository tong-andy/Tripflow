import type { ItineraryItem, Trip, TripDay } from '../types/trip';
import type { MapProvider } from '../types/profile';

export type TripStatus = 'upcoming' | 'active' | 'completed';
export interface ZonedClock { date: string; minutes: number }

export function getZonedClock(now: Date, timezone: string): ZonedClock {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';
  return {
    date: `${value('year')}-${value('month')}-${value('day')}`,
    minutes: Number(value('hour')) * 60 + Number(value('minute')),
  };
}

export function getTripStatus(trip: Pick<Trip,'startDate'|'endDate'|'timezone'>, now = new Date()): TripStatus {
  const today = getZonedClock(now, trip.timezone).date;
  if (today < trip.startDate) return 'upcoming';
  if (today > trip.endDate) return 'completed';
  return 'active';
}

export function getTodayTripDay(trip: Pick<Trip,'days'|'timezone'>, now = new Date()): TripDay | undefined {
  const today = getZonedClock(now, trip.timezone).date;
  return trip.days.find((day) => day.date === today);
}

function minutesOf(time: string): number {
  const [hour, minute] = time.split(':').map(Number);
  return (hour ?? 0) * 60 + (minute ?? 0);
}

export interface TodayItineraryState {
  current: ItineraryItem | undefined;
  next: ItineraryItem | undefined;
  past: ItineraryItem[];
  upcoming: ItineraryItem[];
  untimed: ItineraryItem[];
}

export function getTodayItineraryState(items: ItineraryItem[], nowMinutes: number): TodayItineraryState {
  const timed = items.filter((item) => item.time !== null).sort((a,b) =>
    a.time!.localeCompare(b.time!) || a.createdAt.localeCompare(b.createdAt));
  const untimed = items.filter((item) => item.time === null);
  const finished = timed.filter((item) => item.status !== 'planned');
  const planned = timed.filter((item) => item.status === 'planned');
  const currentCandidates = planned.filter((item) => {
    const start = minutesOf(item.time!);
    return start <= nowMinutes && nowMinutes < start + item.durationMinutes;
  });
  const current = currentCandidates.at(-1);
  const next = planned.find((item) => minutesOf(item.time!) > nowMinutes);
  const pastTimed = planned.filter((item) => minutesOf(item.time!) + item.durationMinutes <= nowMinutes);
  const upcoming = planned.filter((item) => item.id !== current?.id && minutesOf(item.time!) > nowMinutes);
  return { current, next, past: [...finished, ...pastTimed], upcoming, untimed };
}

export function externalNavigationUrl(
  address: string,
  provider: MapProvider = 'system',
  userAgent = typeof navigator === 'undefined' ? '' : navigator.userAgent,
): string {
  const query = encodeURIComponent(address);
  const resolved =
    provider === 'system'
      ? /iPhone|iPad|iPod|Macintosh/i.test(userAgent)
        ? 'apple'
        : 'google'
      : provider;
  switch (resolved) {
    case 'apple':
      return `https://maps.apple.com/?q=${query}`;
    case 'amap':
      return `https://uri.amap.com/search?keyword=${query}&callnative=1`;
    case 'baidu':
      return `https://api.map.baidu.com/geocoder?address=${query}&output=html&src=tripflow`;
    case 'google':
    default:
      return `https://www.google.com/maps/search/?api=1&query=${query}`;
  }
}
