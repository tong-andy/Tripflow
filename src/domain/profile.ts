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
  year: number | null,
  now = new Date(),
): AnnualTravelStats {
  const annualTrips = year === null
    ? trips
    : trips.filter((trip) => Number(trip.startDate.slice(0, 4)) === year);
  const tripIds = new Set(annualTrips.map((trip) => trip.id));
  const completed = annualTrips.filter(
    (trip) =>
      getTripStatus(trip, now) === 'completed',
  );
  const expensesByCurrency = totalsByCurrency(
    expenses.filter((item) => tripIds.has(item.tripId)),
    purchases.filter((item) => tripIds.has(item.tripId)),
  );
  const longest = completed.reduce<Trip | null>(
    (current, trip) =>
      !current || trip.days.length > current.days.length ? trip : current,
    null,
  );
  return {
    year,
    totalTrips: annualTrips.length,
    completedTrips: completed.length,
    totalDays: completed.reduce((total, trip) => total + trip.days.length, 0),
    cities: new Set(
      annualTrips.flatMap((trip) =>
        trip.destinations.map((destination) =>
          `${destination.cityName}\u0000${destination.countryName}`,
        ),
      ),
    ).size,
    countries: new Set(
      annualTrips.flatMap((trip) =>
        trip.destinations.map((destination) => destination.countryName),
      ),
    ).size,
    expensesByCurrency,
    longestTrip: longest
      ? { id: longest.id, name: longest.name, days: longest.days.length }
      : null,
  };
}
