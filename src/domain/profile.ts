import type { Expense, Purchase } from '../types/archive';
import type { AnnualTravelStats, MapProvider } from '../types/profile';
import type { Trip } from '../types/trip';
import { getTripStatus } from './travelMode';
import { totalsByCurrency } from './archive';

export const mapProviderLabels: Record<MapProvider, string> = {
  system: '系统默认',
  apple: 'Apple 地图',
  amap: '高德地图',
  baidu: '百度地图',
  google: 'Google Maps',
};

export function buildAnnualTravelStats(
  trips: Trip[],
  expenses: Expense[],
  purchases: Purchase[],
  year: number,
  now = new Date(),
): AnnualTravelStats {
  const completed = trips.filter(
    (trip) =>
      getTripStatus(trip, now) === 'completed' &&
      Number(trip.endDate.slice(0, 4)) === year,
  );
  const expensesByCurrency = totalsByCurrency(expenses, purchases);
  const longest = completed.reduce<Trip | null>(
    (current, trip) =>
      !current || trip.days.length > current.days.length ? trip : current,
    null,
  );
  return {
    year,
    completedTrips: completed.length,
    totalDays: completed.reduce((total, trip) => total + trip.days.length, 0),
    destinations: new Set(completed.map((trip) => trip.destination.trim())).size,
    expensesByCurrency,
    longestTrip: longest
      ? { id: longest.id, name: longest.name, days: longest.days.length }
      : null,
  };
}
