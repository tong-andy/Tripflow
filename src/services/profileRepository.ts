import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';
import type { Expense } from '../types/archive';
import type {
  MapProvider,
  ProfileData,
  UpdateUserProfileInput,
  UserProfile,
} from '../types/profile';
import { mapProviders } from '../types/profile';
import { mapExpense } from './archiveRepository';
import { mapPurchase } from './archiveRepository';
import { getSupabaseClient } from './supabase';

type ProfileRow = Database['public']['Tables']['user_profiles']['Row'];

export interface ProfileRepository {
  loadProfile(userId: string): Promise<ProfileData>;
  saveProfile(
    userId: string,
    input: UpdateUserProfileInput,
  ): Promise<UserProfile>;
}

function assertUser(userId: string) {
  if (!userId) throw new Error('登录状态已失效，请重新登录。');
}

function fail(error: { message: string } | null) {
  if (!error) return;
  if (/failed to fetch|network/i.test(error.message)) {
    throw new Error('无法连接云端数据，请检查网络后重试。');
  }
  throw new Error('用户设置操作失败，请稍后重试。');
}

function isMapProvider(value: string): value is MapProvider {
  return mapProviders.includes(value as MapProvider);
}

export function defaultUserProfile(userId: string, hasMediaNotes = false): UserProfile {
  const now = new Date().toISOString();
  return {
    userId,
    nickname: '',
    homeLocation: '',
    defaultCurrency: 'CNY',
    defaultTimezone:
      Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Shanghai',
    defaultMapProvider: 'system',
    showExpenses: true,
    showPurchases: true,
    showJournals: true,
    showMediaNotes: hasMediaNotes,
    recordPreferencesConfigured: false,
    createdAt: now,
    updatedAt: now,
  };
}

export function mapUserProfile(row: ProfileRow): UserProfile {
  if (!isMapProvider(row.default_map_provider)) {
    throw new Error('云端默认地图设置无效。');
  }
  return {
    userId: row.user_id,
    nickname: row.nickname,
    homeLocation: row.home_location,
    defaultCurrency: row.default_currency,
    defaultTimezone: row.default_timezone,
    defaultMapProvider: row.default_map_provider,
    showExpenses: row.show_expenses,
    showPurchases: row.show_purchases,
    showJournals: row.show_journals,
    showMediaNotes: row.show_media_notes,
    recordPreferencesConfigured: row.record_preferences_configured,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createSupabaseProfileRepository(
  client?: SupabaseClient<Database>,
): ProfileRepository {
  const database = () => client ?? getSupabaseClient();
  return {
    async loadProfile(userId) {
      assertUser(userId);
      const [profileResult, expensesResult, purchasesResult, mediaResult] = await Promise.all([
        database()
          .from('user_profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle(),
        database()
          .from('expenses')
          .select('*')
          .eq('user_id', userId)
          .order('date', { ascending: false }),
        database()
          .from('purchases')
          .select('*')
          .eq('user_id', userId)
          .order('date', { ascending: false }),
        database()
          .from('media_notes')
          .select('id')
          .eq('user_id', userId)
          .limit(1),
      ]);
      fail(profileResult.error);
      fail(expensesResult.error);
      fail(purchasesResult.error);
      fail(mediaResult.error);
      const hasMediaNotes = (mediaResult.data ?? []).length > 0;
      const storedProfile = profileResult.data
        ? mapUserProfile(profileResult.data)
        : defaultUserProfile(userId, hasMediaNotes);
      return {
        profile:
          !storedProfile.recordPreferencesConfigured && hasMediaNotes
            ? { ...storedProfile, showMediaNotes: true }
            : storedProfile,
        expenses: (expensesResult.data ?? []).map(mapExpense) as Expense[],
        purchases: (purchasesResult.data ?? []).map(mapPurchase),
      };
    },

    async saveProfile(userId, input) {
      assertUser(userId);
      const currency = input.defaultCurrency.trim().toUpperCase();
      if (!/^[A-Z]{3}$/.test(currency)) {
        throw new Error('默认货币需使用三位 ISO 代码。');
      }
      if (
        !input.showExpenses &&
        !input.showPurchases &&
        !input.showJournals &&
        !input.showMediaNotes
      ) {
        throw new Error('至少保留一个记录模块。');
      }
      try {
        new Intl.DateTimeFormat('en', {
          timeZone: input.defaultTimezone,
        }).format();
      } catch {
        throw new Error('请输入有效的 IANA timezone。');
      }
      const { data, error } = await database()
        .from('user_profiles')
        .upsert(
          {
            user_id: userId,
            nickname: input.nickname.trim(),
            home_location: input.homeLocation.trim(),
            default_currency: currency,
            default_timezone: input.defaultTimezone,
            default_map_provider: input.defaultMapProvider,
            show_expenses: input.showExpenses,
            show_purchases: input.showPurchases,
            show_journals: input.showJournals,
            show_media_notes: input.showMediaNotes,
            record_preferences_configured: true,
          },
          { onConflict: 'user_id' },
        )
        .select('*')
        .single();
      fail(error);
      if (!data) throw new Error('云端未返回用户设置，请重试。');
      return mapUserProfile(data);
    },
  };
}

export const supabaseProfileRepository = createSupabaseProfileRepository();
