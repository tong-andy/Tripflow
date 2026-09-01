import { describe, expect, it } from 'vitest';
import { seedTrip } from '../data/seed';
import type { ItineraryItem } from '../types/trip';
import {
  buildTripDays,
  createTrip,
  getTripStats,
  sortItineraryItems,
} from './trips';

function sequentialIdFactory() {
  let id = 0;
  return (prefix: string) => `${prefix}-${++id}`;
}

describe('trip domain', () => {
  it('generates an inclusive sequence of trip days across month boundaries', () => {
    const days = buildTripDays(
      'trip-1',
      '2026-10-30',
      '2026-11-02',
      sequentialIdFactory(),
    );

    expect(days.map((day) => day.date)).toEqual([
      '2026-10-30',
      '2026-10-31',
      '2026-11-01',
      '2026-11-02',
    ]);
    expect(days.map((day) => day.dayNumber)).toEqual([1, 2, 3, 4]);
  });

  it('creates a trimmed trip with generated days', () => {
    const trip = createTrip(
      {
        name: '  冬日北海道  ',
        destination: '  札幌  ',
        departureLocation: '  上海  ',
        startDate: '2027-01-04',
        endDate: '2027-01-06',
        destinations: [{ cityName: '札幌', countryName: '日本', latitude: 43.0618, longitude: 141.3545 }],
      },
      sequentialIdFactory(),
      new Date('2026-08-30T00:00:00.000Z'),
    );

    expect(trip.name).toBe('冬日北海道');
    expect(trip.destination).toBe('札幌');
    expect(trip.days).toHaveLength(3);
    expect(trip.days.every((day) => day.tripId === trip.id)).toBe(true);
  });

  it('rejects a return date before the departure date', () => {
    expect(() =>
      buildTripDays('trip-1', '2026-10-20', '2026-10-18'),
    ).toThrow('返程日期不能早于出发日期');
  });

  it('calculates preparation progress and planned day count', () => {
    expect(getTripStats(seedTrip)).toMatchObject({
      totalDays: 8,
      preparationCompleted: 2,
      preparationTotal: 4,
      preparationPercent: 50,
      plannedDays: 2,
    });
  });

  it('sorts itinerary items by time', () => {
    const baseItem: ItineraryItem = {
      id: 'item',
      tripId: 'trip',
      tripDayId: 'day',
      time: '12:00',
      placeName: '地点',
      durationMinutes: 60,
      notes: '',
      status: 'planned',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    const items = [
      { ...baseItem, id: 'late', time: '18:30' },
      { ...baseItem, id: 'early', time: '08:15' },
      { ...baseItem, id: 'middle', time: '12:00' },
    ];

    expect(sortItineraryItems(items).map((item) => item.id)).toEqual([
      'early',
      'middle',
      'late',
    ]);
  });
});
