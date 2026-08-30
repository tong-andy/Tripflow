import type { Expense, Purchase } from '../types/archive';
import type { Trip } from '../types/trip';
import { buildAnnualTravelStats } from './profile';

function trip(id: string, destination: string, startDate: string, endDate: string, days: number): Trip {
  return {
    id,
    name: `旅行 ${id}`,
    destination,
    departureLocation: '上海',
    startDate,
    endDate,
    timezone: 'Asia/Shanghai',
    travelNote: null,
    days: Array.from({ length: days }, (_, index) => ({
      id: `${id}-day-${index}`,
      tripId: id,
      dayNumber: index + 1,
      date: startDate,
    })),
    preparationItems: [],
    itineraryItems: [],
    budgetAmount: null,
    budgetCurrency: null,
    createdAt: `${startDate}T00:00:00Z`,
    updatedAt: `${endDate}T00:00:00Z`,
  };
}

function expense(currency: string, amount: number): Expense {
  return {
    id: `${currency}-${amount}`,
    tripId: 'trip',
    date: '2026-01-01',
    title: '消费',
    amount,
    currency,
    category: 'other',
    notes: '',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };
}

function purchase(currency: string, amount: number): Purchase {
  return { id: `purchase-${currency}`, tripId: 'trip', date: '2026-01-01', title: '购物', amount, currency, location: '', recipient: '', notes: '', organized: false, purchased: true, includeInExpenses: true, createdAt: '', updatedAt: '' };
}

describe('annual profile statistics', () => {
  it('counts only completed trips in the year and keeps currencies separate', () => {
    const stats = buildAnnualTravelStats(
      [
        trip('a', '东京', '2026-01-01', '2026-01-03', 3),
        trip('b', '东京', '2026-02-01', '2026-02-05', 5),
        trip('future', '大阪', '2026-12-01', '2026-12-02', 2),
      ],
      [expense('CNY', 100), expense('CNY', 20), expense('JPY', 500)],
      [purchase('JPY', 300)],
      2026,
      new Date('2026-08-31T00:00:00Z'),
    );

    expect(stats).toMatchObject({
      totalTrips: 3,
      completedTrips: 2,
      totalDays: 8,
      destinations: 1,
      expensesByCurrency: { CNY: 120, JPY: 800 },
      longestTrip: { id: 'b', days: 5 },
    });
  });
});
