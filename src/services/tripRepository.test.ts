import type { SupabaseClient } from '@supabase/supabase-js';
import { vi } from 'vitest';
import type { Database } from '../types/database';
import {
  createSupabaseTripRepository,
  mapItineraryItem,
} from './tripRepository';

interface QueryResult {
  data: unknown;
  error: { message: string } | null;
}

interface MockBuilder {
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  then: PromiseLike<QueryResult>['then'];
}

function makeRow(overrides: Record<string, unknown>) {
  return {
    id: 'row-id',
    user_id: 'user-1',
    created_at: '2026-08-31T00:00:00.000Z',
    updated_at: '2026-08-31T00:00:00.000Z',
    ...overrides,
  };
}

function createMockClient(
  responses: Record<string, QueryResult[]>,
  rpcResult: QueryResult = { data: null, error: null },
) {
  const builders: Array<{ table: string; builder: MockBuilder }> = [];

  function from(table: string) {
    const result = responses[table]?.shift() ?? { data: [], error: null };
    const builder = {} as MockBuilder;
    builder.select = vi.fn(() => builder);
    builder.eq = vi.fn(() => builder);
    builder.order = vi.fn(() => builder);
    builder.insert = vi.fn(() => builder);
    builder.update = vi.fn(() => builder);
    builder.delete = vi.fn(() => builder);
    builder.single = vi.fn(() => builder);
    builder.then = (onfulfilled, onrejected) =>
      Promise.resolve(result).then(onfulfilled, onrejected);
    builders.push({ table, builder });
    return builder;
  }

  const rpc = vi.fn().mockResolvedValue(rpcResult);
  const client = { from: vi.fn(from), rpc } as unknown as SupabaseClient<Database>;
  return { client, builders, rpc };
}

const tripRow = makeRow({
  id: 'trip-1',
  name: '杭州周末',
  destination: '杭州',
  departure_location: '上海',
  start_date: '2026-11-06',
  end_date: '2026-11-08',
});

const dayRow = makeRow({
  id: 'day-1',
  trip_id: 'trip-1',
  day_number: 1,
  date: '2026-11-06',
});

describe('Supabase trip repository', () => {
  it('loads and maps all cloud entities for the current user', async () => {
    const preparationRow = makeRow({
      id: 'prep-1',
      trip_id: 'trip-1',
      title: '带护照',
      category: 'documents',
      completed: false,
    });
    const itineraryRow = makeRow({
      id: 'item-1',
      trip_id: 'trip-1',
      trip_day_id: 'day-1',
      time: '09:30:00',
      place_name: '西湖',
      duration_minutes: 120,
      notes: '',
      status: 'planned',
    });
    const { client, builders } = createMockClient({
      trips: [{ data: [tripRow], error: null }],
      trip_days: [{ data: [dayRow], error: null }],
      preparation_items: [{ data: [preparationRow], error: null }],
      itinerary_items: [{ data: [itineraryRow], error: null }],
    });

    const trips = await createSupabaseTripRepository(client).listTrips('user-1');

    expect(trips[0]).toMatchObject({
      id: 'trip-1',
      departureLocation: '上海',
      days: [{ id: 'day-1', dayNumber: 1 }],
      preparationItems: [{ id: 'prep-1', category: 'documents' }],
      itineraryItems: [{ id: 'item-1', time: '09:30' }],
    });
    for (const { builder } of builders) {
      expect(builder.eq).toHaveBeenCalledWith('user_id', 'user-1');
    }
  });

  it('uses the atomic RPC to create a trip and its days', async () => {
    const { client, rpc } = createMockClient(
      {
        trips: [{ data: [tripRow], error: null }],
        trip_days: [{ data: [dayRow], error: null }],
        preparation_items: [{ data: [], error: null }],
        itinerary_items: [{ data: [], error: null }],
      },
      { data: 'trip-1', error: null },
    );

    const trip = await createSupabaseTripRepository(client).createTrip(
      'user-1',
      {
        name: ' 杭州周末 ',
        destination: '杭州',
        departureLocation: '上海',
        startDate: '2026-11-06',
        endDate: '2026-11-08',
        timezone: 'Asia/Shanghai',
      },
    );

    expect(rpc).toHaveBeenCalledWith('create_trip_with_days_v2', {
      p_name: '杭州周末',
      p_destination: '杭州',
      p_departure_location: '上海',
      p_start_date: '2026-11-06',
      p_end_date: '2026-11-08',
      p_timezone: 'Asia/Shanghai',
    });
    expect(trip.id).toBe('trip-1');
  });

  it('scopes preparation updates to the current user', async () => {
    const preparationRow = makeRow({
      id: 'prep-1',
      trip_id: 'trip-1',
      title: '确认护照',
      category: 'documents',
      completed: true,
    });
    const { client, builders } = createMockClient({
      preparation_items: [{ data: preparationRow, error: null }],
    });

    const item = await createSupabaseTripRepository(
      client,
    ).updatePreparationItem('user-1', 'prep-1', { completed: true });

    expect(item.completed).toBe(true);
    expect(builders[0]?.builder.update).toHaveBeenCalledWith({
      completed: true,
    });
    expect(builders[0]?.builder.eq).toHaveBeenCalledWith('id', 'prep-1');
    expect(builders[0]?.builder.eq).toHaveBeenCalledWith('user_id', 'user-1');
  });

  it('rejects repository access without an authenticated user id', async () => {
    const { client } = createMockClient({});
    await expect(
      createSupabaseTripRepository(client).listTrips(''),
    ).rejects.toThrow('登录状态已失效');
  });

  it('normalizes database time values and validates status', () => {
    expect(
      mapItineraryItem(
        makeRow({
          trip_id: 'trip-1',
          trip_day_id: 'day-1',
          time: '16:00:00',
          place_name: '西湖',
          duration_minutes: 60,
          notes: '',
          status: 'completed',
        }) as Database['public']['Tables']['itinerary_items']['Row'],
      ),
    ).toMatchObject({ time: '16:00', status: 'completed' });
  });
});
