import type { SupabaseClient } from '@supabase/supabase-js';
import { buildTripDays } from '../domain/trips';
import type { Database } from '../types/database';
import type {
  CreateItineraryItemInput,
  CreatePreparationItemInput,
  CreateTripDayInput,
  CreateTripInput,
  ItineraryItem,
  ItineraryStatus,
  PreparationCategory,
  PreparationItem,
  Trip,
  TripDay,
  UpdateItineraryItemInput,
  UpdateTripInput,
} from '../types/trip';
import { getSupabaseClient } from './supabase';

type TripRow = Database['public']['Tables']['trips']['Row'];
type TripDayRow = Database['public']['Tables']['trip_days']['Row'];
type PreparationRow =
  Database['public']['Tables']['preparation_items']['Row'];
type ItineraryRow = Database['public']['Tables']['itinerary_items']['Row'];

export interface TripRepository {
  listTrips: (userId: string) => Promise<Trip[]>;
  createTrip: (userId: string, input: CreateTripInput) => Promise<Trip>;
  updateTrip: (
    userId: string,
    tripId: string,
    input: UpdateTripInput,
  ) => Promise<Trip>;
  deleteTrip: (userId: string, tripId: string) => Promise<void>;
  listTripDays: (userId: string, tripId: string) => Promise<TripDay[]>;
  createTripDays: (
    userId: string,
    tripId: string,
    inputs: CreateTripDayInput[],
  ) => Promise<TripDay[]>;
  createPreparationItem: (
    userId: string,
    tripId: string,
    input: CreatePreparationItemInput,
  ) => Promise<PreparationItem>;
  updatePreparationItem: (
    userId: string,
    itemId: string,
    updates: Partial<Pick<PreparationItem, 'title' | 'category' | 'completed'>>,
  ) => Promise<PreparationItem>;
  deletePreparationItem: (userId: string, itemId: string) => Promise<void>;
  createItineraryItem: (
    userId: string,
    tripId: string,
    input: CreateItineraryItemInput,
  ) => Promise<ItineraryItem>;
  updateItineraryItem: (
    userId: string,
    itemId: string,
    updates: UpdateItineraryItemInput,
  ) => Promise<ItineraryItem>;
  deleteItineraryItem: (userId: string, itemId: string) => Promise<void>;
}

function assertUserId(userId: string): void {
  if (!userId) throw new Error('登录状态已失效，请重新登录。');
}

function assertTimezone(timezone: string): void {
  try {
    new Intl.DateTimeFormat('en', { timeZone: timezone }).format();
  } catch {
    throw new Error('请输入有效的 IANA timezone，例如 Asia/Tokyo。');
  }
}

function throwRepositoryError(error: { message: string } | null): void {
  if (!error) return;
  if (/failed to fetch|network/i.test(error.message)) {
    throw new Error('无法连接云端数据，请检查网络后重试。');
  }
  throw new Error('云端数据操作失败，请稍后重试。');
}

function isPreparationCategory(value: string): value is PreparationCategory {
  return ['documents', 'booking', 'packing', 'other'].includes(value);
}

function isItineraryStatus(value: string): value is ItineraryStatus {
  return ['planned', 'completed', 'skipped'].includes(value);
}

export function mapTripDay(row: TripDayRow): TripDay {
  return {
    id: row.id,
    tripId: row.trip_id,
    dayNumber: row.day_number,
    date: row.date,
  };
}

export function mapPreparationItem(row: PreparationRow): PreparationItem {
  if (!isPreparationCategory(row.category)) {
    throw new Error('云端准备事项分类无效。');
  }
  return {
    id: row.id,
    tripId: row.trip_id,
    title: row.title,
    category: row.category,
    completed: row.completed,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapItineraryItem(row: ItineraryRow): ItineraryItem {
  if (!isItineraryStatus(row.status)) {
    throw new Error('云端行程状态无效。');
  }
  return {
    id: row.id,
    tripId: row.trip_id,
    tripDayId: row.trip_day_id,
    time: row.time?.slice(0, 5) ?? null,
    placeName: row.place_name,
    address: row.address ?? '',
    durationMinutes: row.duration_minutes,
    notes: row.notes,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapTrips(
  tripRows: TripRow[],
  dayRows: TripDayRow[],
  preparationRows: PreparationRow[],
  itineraryRows: ItineraryRow[],
): Trip[] {
  return tripRows.map((row) => ({
    id: row.id,
    name: row.name,
    destination: row.destination,
    departureLocation: row.departure_location,
    startDate: row.start_date,
    endDate: row.end_date,
    days: dayRows
      .filter((day) => day.trip_id === row.id)
      .sort((left, right) => left.day_number - right.day_number)
      .map(mapTripDay),
    preparationItems: preparationRows
      .filter((item) => item.trip_id === row.id)
      .map(mapPreparationItem),
    itineraryItems: itineraryRows
      .filter((item) => item.trip_id === row.id)
      .map(mapItineraryItem),
    budgetAmount: row.budget_amount == null ? null : Number(row.budget_amount),
    budgetCurrency: row.budget_currency ?? null,
    timezone: row.timezone ?? 'Asia/Shanghai',
    travelNote: row.travel_note ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export function createSupabaseTripRepository(
  client?: SupabaseClient<Database>,
): TripRepository {
  const database = () => client ?? getSupabaseClient();
  const repository: TripRepository = {
    async listTrips(userId) {
      assertUserId(userId);
      const [trips, days, preparationItems, itineraryItems] =
        await Promise.all([
          database()
            .from('trips')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: true }),
          database()
            .from('trip_days')
            .select('*')
            .eq('user_id', userId)
            .order('day_number', { ascending: true }),
          database()
            .from('preparation_items')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: true }),
          database()
            .from('itinerary_items')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: true }),
        ]);

      throwRepositoryError(trips.error);
      throwRepositoryError(days.error);
      throwRepositoryError(preparationItems.error);
      throwRepositoryError(itineraryItems.error);

      return mapTrips(
        trips.data ?? [],
        days.data ?? [],
        preparationItems.data ?? [],
        itineraryItems.data ?? [],
      );
    },

    async createTrip(userId, input) {
      assertUserId(userId);
      const values = [
        input.name,
        input.destination,
        input.departureLocation,
        input.startDate,
        input.endDate,
      ];
      if (values.some((value) => !value.trim())) {
        throw new Error('请完整填写旅行信息。');
      }
      buildTripDays('date-validation', input.startDate, input.endDate);
      const timezone = input.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'Asia/Shanghai';
      assertTimezone(timezone);

      const { data: tripId, error } = await database().rpc(
        'create_trip_with_days_v2',
        {
          p_name: input.name.trim(),
          p_destination: input.destination.trim(),
          p_departure_location: input.departureLocation.trim(),
          p_start_date: input.startDate,
          p_end_date: input.endDate,
          p_timezone: timezone,
        },
      );
      throwRepositoryError(error);
      if (!tripId) throw new Error('云端未返回新旅行，请重试。');

      const trips = await repository.listTrips(userId);
      const trip = trips.find((candidate) => candidate.id === tripId);
      if (!trip) throw new Error('旅行已创建，但暂时无法读取，请刷新重试。');
      return trip;
    },

    async updateTrip(userId, tripId, input) {
      assertUserId(userId);
      const update: Database['public']['Tables']['trips']['Update'] = {};
      if (input.name !== undefined) update.name = input.name.trim();
      if (input.destination !== undefined) {
        update.destination = input.destination.trim();
      }
      if (input.departureLocation !== undefined) {
        update.departure_location = input.departureLocation.trim();
      }
      if (input.budgetAmount !== undefined) update.budget_amount = input.budgetAmount;
      if (input.budgetCurrency !== undefined) {
        update.budget_currency = input.budgetCurrency?.trim().toUpperCase() ?? null;
      }
      if (input.timezone !== undefined) {
        assertTimezone(input.timezone);
        update.timezone = input.timezone;
      }
      if (input.travelNote !== undefined) {
        const note = input.travelNote?.trim() ?? '';
        if (note.length > 10000) throw new Error('旅行备注不能超过 10000 个字符。');
        update.travel_note = note || null;
      }

      const { error } = await database()
        .from('trips')
        .update(update)
        .eq('id', tripId)
        .eq('user_id', userId);
      throwRepositoryError(error);

      const trips = await repository.listTrips(userId);
      const trip = trips.find((candidate) => candidate.id === tripId);
      if (!trip) throw new Error('找不到需要更新的旅行。');
      return trip;
    },

    async deleteTrip(userId, tripId) {
      assertUserId(userId);
      const { error } = await database()
        .from('trips')
        .delete()
        .eq('id', tripId)
        .eq('user_id', userId);
      throwRepositoryError(error);
    },

    async listTripDays(userId, tripId) {
      assertUserId(userId);
      const { data, error } = await database()
        .from('trip_days')
        .select('*')
        .eq('trip_id', tripId)
        .eq('user_id', userId)
        .order('day_number', { ascending: true });
      throwRepositoryError(error);
      return (data ?? []).map(mapTripDay);
    },

    async createTripDays(userId, tripId, inputs) {
      assertUserId(userId);
      if (inputs.length === 0) return [];
      const { data, error } = await database()
        .from('trip_days')
        .insert(
          inputs.map((input) => ({
            user_id: userId,
            trip_id: tripId,
            day_number: input.dayNumber,
            date: input.date,
          })),
        )
        .select('*');
      throwRepositoryError(error);
      return (data ?? []).map(mapTripDay);
    },

    async createPreparationItem(userId, tripId, input) {
      assertUserId(userId);
      const { data, error } = await database()
        .from('preparation_items')
        .insert({
          user_id: userId,
          trip_id: tripId,
          title: input.title.trim(),
          category: input.category,
        })
        .select('*')
        .single();
      throwRepositoryError(error);
      if (!data) throw new Error('云端未返回准备事项，请重试。');
      return mapPreparationItem(data);
    },

    async updatePreparationItem(userId, itemId, updates) {
      assertUserId(userId);
      const update: Database['public']['Tables']['preparation_items']['Update'] =
        {};
      if (updates.title !== undefined) update.title = updates.title.trim();
      if (updates.category !== undefined) update.category = updates.category;
      if (updates.completed !== undefined) update.completed = updates.completed;
      const { data, error } = await database()
        .from('preparation_items')
        .update(update)
        .eq('id', itemId)
        .eq('user_id', userId)
        .select('*')
        .single();
      throwRepositoryError(error);
      if (!data) throw new Error('找不到需要更新的准备事项。');
      return mapPreparationItem(data);
    },

    async deletePreparationItem(userId, itemId) {
      assertUserId(userId);
      const { error } = await database()
        .from('preparation_items')
        .delete()
        .eq('id', itemId)
        .eq('user_id', userId);
      throwRepositoryError(error);
    },

    async createItineraryItem(userId, tripId, input) {
      assertUserId(userId);
      const { data, error } = await database()
        .from('itinerary_items')
        .insert({
          user_id: userId,
          trip_id: tripId,
          trip_day_id: input.tripDayId,
          time: input.time,
          place_name: input.placeName.trim(),
          address: input.address?.trim() ?? '',
          duration_minutes: input.durationMinutes,
          notes: input.notes.trim(),
          status: input.status,
        })
        .select('*')
        .single();
      throwRepositoryError(error);
      if (!data) throw new Error('云端未返回行程安排，请重试。');
      return mapItineraryItem(data);
    },

    async updateItineraryItem(userId, itemId, updates) {
      assertUserId(userId);
      const update: Database['public']['Tables']['itinerary_items']['Update'] =
        {};
      if (updates.tripDayId !== undefined) {
        update.trip_day_id = updates.tripDayId;
      }
      if (updates.time !== undefined) update.time = updates.time;
      if (updates.placeName !== undefined) {
        update.place_name = updates.placeName.trim();
      }
      if (updates.address !== undefined) update.address = updates.address.trim();
      if (updates.durationMinutes !== undefined) {
        update.duration_minutes = updates.durationMinutes;
      }
      if (updates.notes !== undefined) update.notes = updates.notes.trim();
      if (updates.status !== undefined) update.status = updates.status;
      const { data, error } = await database()
        .from('itinerary_items')
        .update(update)
        .eq('id', itemId)
        .eq('user_id', userId)
        .select('*')
        .single();
      throwRepositoryError(error);
      if (!data) throw new Error('找不到需要更新的行程安排。');
      return mapItineraryItem(data);
    },

    async deleteItineraryItem(userId, itemId) {
      assertUserId(userId);
      const { error } = await database()
        .from('itinerary_items')
        .delete()
        .eq('id', itemId)
        .eq('user_id', userId);
      throwRepositoryError(error);
    },
  };

  return repository;
}

export const supabaseTripRepository = createSupabaseTripRepository();
