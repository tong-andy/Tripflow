import type {
  CreateTripInput,
  ItineraryItem,
  PreparationItem,
  Trip,
  TripDay,
} from '../types/trip';

type IdFactory = (prefix: string) => string;

export interface TripStats {
  totalDays: number;
  preparationCompleted: number;
  preparationTotal: number;
  preparationPercent: number;
  plannedDays: number;
}

export function createId(prefix: string): string {
  const randomPart =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return `${prefix}-${randomPart}`;
}

export function parseLocalDate(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function buildTripDays(
  tripId: string,
  startDate: string,
  endDate: string,
  idFactory: IdFactory = createId,
): TripDay[] {
  const start = parseLocalDate(startDate);
  const end = parseLocalDate(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error('旅行日期格式无效');
  }

  if (end < start) {
    throw new Error('返程日期不能早于出发日期');
  }

  const days: TripDay[] = [];
  const cursor = new Date(start);

  while (cursor <= end) {
    days.push({
      id: idFactory('day'),
      tripId,
      dayNumber: days.length + 1,
      date: toIsoDate(cursor),
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}

export function createTrip(
  input: CreateTripInput,
  idFactory: IdFactory = createId,
  now: Date = new Date(),
): Trip {
  const values = [
    input.name,
    input.destination,
    input.departureLocation,
    input.startDate,
    input.endDate,
  ];

  if (values.some((value) => value.trim().length === 0)) {
    throw new Error('请完整填写旅行信息');
  }

  const id = idFactory('trip');
  const timestamp = now.toISOString();

  return {
    id,
    name: input.name.trim(),
    destination: input.destination.trim(),
    departureLocation: input.departureLocation.trim(),
    startDate: input.startDate,
    endDate: input.endDate,
    days: buildTripDays(id, input.startDate, input.endDate, idFactory),
    preparationItems: [],
    itineraryItems: [],
    destinations: input.destinations.map((destination, index) => ({
      id: idFactory('destination'),
      tripId: id,
      ...destination,
      sortOrder: index,
      createdAt: timestamp,
      updatedAt: timestamp,
    })),
    budgetAmount: null,
    budgetCurrency: null,
    timezone: input.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'Asia/Shanghai',
    travelNote: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function getTripStats(trip: Trip): TripStats {
  const preparationCompleted = trip.preparationItems.filter(
    (item) => item.completed,
  ).length;
  const preparationTotal = trip.preparationItems.length;
  const plannedDayIds = new Set(
    trip.itineraryItems.map((item) => item.tripDayId),
  );

  return {
    totalDays: trip.days.length,
    preparationCompleted,
    preparationTotal,
    preparationPercent:
      preparationTotal === 0
        ? 0
        : Math.round((preparationCompleted / preparationTotal) * 100),
    plannedDays: plannedDayIds.size,
  };
}

export function sortItineraryItems(
  items: ItineraryItem[],
): ItineraryItem[] {
  return [...items].sort((left, right) => {
    if (left.time === null) {
      return right.time === null
        ? left.createdAt.localeCompare(right.createdAt)
        : 1;
    }
    if (right.time === null) return -1;
    const timeOrder = left.time.localeCompare(right.time);
    return timeOrder !== 0
      ? timeOrder
      : left.createdAt.localeCompare(right.createdAt);
  });
}

export function groupPreparationItems(
  items: PreparationItem[],
): Map<PreparationItem['category'], PreparationItem[]> {
  const grouped = new Map<PreparationItem['category'], PreparationItem[]>();

  for (const item of items) {
    const current = grouped.get(item.category) ?? [];
    grouped.set(item.category, [...current, item]);
  }

  return grouped;
}
