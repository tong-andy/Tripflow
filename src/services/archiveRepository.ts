import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';
import type {
  ArchiveData, CreateExpenseInput, CreateJournalInput, CreateMediaNoteInput,
  CreatePurchaseInput, Expense, ExpenseCategory, Journal, MediaNote, MediaType,
  Purchase, UpdateExpenseInput, UpdateJournalInput, UpdateMediaNoteInput,
  UpdatePurchaseInput,
} from '../types/archive';
import { expenseCategories } from '../types/archive';
import { getSupabaseClient } from './supabase';

type ExpenseRow = Database['public']['Tables']['expenses']['Row'];
type PurchaseRow = Database['public']['Tables']['purchases']['Row'];
type MediaRow = Database['public']['Tables']['media_notes']['Row'];
type JournalRow = Database['public']['Tables']['journals']['Row'];

export interface ArchiveRepository {
  loadArchive(userId: string, tripId: string): Promise<ArchiveData>;
  createExpense(userId: string, tripId: string, input: CreateExpenseInput): Promise<Expense>;
  updateExpense(userId: string, id: string, input: UpdateExpenseInput): Promise<Expense>;
  deleteExpense(userId: string, id: string): Promise<void>;
  createPurchase(userId: string, tripId: string, input: CreatePurchaseInput): Promise<Purchase>;
  updatePurchase(userId: string, id: string, input: UpdatePurchaseInput): Promise<Purchase>;
  deletePurchase(userId: string, id: string): Promise<void>;
  createMediaNote(userId: string, tripId: string, input: CreateMediaNoteInput): Promise<MediaNote>;
  updateMediaNote(userId: string, id: string, input: UpdateMediaNoteInput): Promise<MediaNote>;
  deleteMediaNote(userId: string, id: string): Promise<void>;
  createJournal(userId: string, tripId: string, input: CreateJournalInput): Promise<Journal>;
  updateJournal(userId: string, id: string, input: UpdateJournalInput): Promise<Journal>;
  deleteJournal(userId: string, id: string): Promise<void>;
}

function requireUser(userId: string) { if (!userId) throw new Error('登录状态已失效，请重新登录。'); }
function fail(error: { message: string } | null) {
  if (!error) return;
  if (/failed to fetch|network/i.test(error.message)) throw new Error('无法连接云端数据，请检查网络后重试。');
  if (/duplicate|unique/i.test(error.message)) throw new Error('这一天已经有一篇日记。');
  throw new Error('归档数据操作失败，请稍后重试。');
}
function currency(value: string) { return value.trim().toUpperCase(); }
function expenseCategory(value: string): ExpenseCategory {
  if (!expenseCategories.includes(value as ExpenseCategory)) throw new Error('云端消费分类无效。');
  return value as ExpenseCategory;
}
function mediaType(value: string): MediaType {
  if (!['video','photo','audio','other'].includes(value)) throw new Error('云端素材类型无效。');
  return value as MediaType;
}
export function mapExpense(row: ExpenseRow): Expense { return { id: row.id, tripId: row.trip_id, date: row.date, title: row.title, amount: Number(row.amount), currency: row.currency, category: expenseCategory(row.category), notes: row.notes, createdAt: row.created_at, updatedAt: row.updated_at }; }
export function mapPurchase(row: PurchaseRow): Purchase { return { id: row.id, tripId: row.trip_id, date: row.date, title: row.title, amount: Number(row.amount), currency: row.currency, location: row.location, recipient: row.recipient, notes: row.notes, organized: row.organized, createdAt: row.created_at, updatedAt: row.updated_at }; }
export function mapMediaNote(row: MediaRow): MediaNote { return { id: row.id, tripId: row.trip_id, tripDayId: row.trip_day_id, itineraryItemId: row.itinerary_item_id, mediaType: mediaType(row.media_type), filename: row.filename, notes: row.notes, favorite: row.favorite, createdAt: row.created_at, updatedAt: row.updated_at }; }
export function mapJournal(row: JournalRow): Journal { return { id: row.id, tripId: row.trip_id, tripDayId: row.trip_day_id, content: row.content, rating: row.rating, createdAt: row.created_at, updatedAt: row.updated_at }; }

export function createSupabaseArchiveRepository(client?: SupabaseClient<Database>): ArchiveRepository {
  const db = () => client ?? getSupabaseClient();
  async function one<T>(query: PromiseLike<{ data: T | null; error: { message: string } | null }>, missing: string): Promise<T> {
    const { data, error } = await query; fail(error); if (!data) throw new Error(missing); return data;
  }
  return {
    async loadArchive(userId, tripId) {
      requireUser(userId);
      const [expenses, purchases, mediaNotes, journals] = await Promise.all([
        db().from('expenses').select('*').eq('user_id',userId).eq('trip_id',tripId).order('created_at',{ascending:false}),
        db().from('purchases').select('*').eq('user_id',userId).eq('trip_id',tripId).order('created_at',{ascending:false}),
        db().from('media_notes').select('*').eq('user_id',userId).eq('trip_id',tripId).order('created_at',{ascending:false}),
        db().from('journals').select('*').eq('user_id',userId).eq('trip_id',tripId).order('created_at',{ascending:false}),
      ]); [expenses,purchases,mediaNotes,journals].forEach((r) => fail(r.error));
      return { expenses: (expenses.data ?? []).map(mapExpense), purchases: (purchases.data ?? []).map(mapPurchase), mediaNotes: (mediaNotes.data ?? []).map(mapMediaNote), journals: (journals.data ?? []).map(mapJournal) };
    },
    async createExpense(userId, tripId, input) { requireUser(userId); const row = await one<ExpenseRow>(db().from('expenses').insert({ user_id:userId, trip_id:tripId, date:input.date, title:input.title.trim(), amount:input.amount, currency:currency(input.currency), category:input.category, notes:input.notes.trim() }).select('*').single(), '云端未返回消费记录。'); return mapExpense(row); },
    async updateExpense(userId, id, input) { requireUser(userId); const row = await one<ExpenseRow>(db().from('expenses').update({ date:input.date, title:input.title.trim(), amount:input.amount, currency:currency(input.currency), category:input.category, notes:input.notes.trim() }).eq('id',id).eq('user_id',userId).select('*').single(), '找不到消费记录。'); return mapExpense(row); },
    async deleteExpense(userId,id) { requireUser(userId); const {error}=await db().from('expenses').delete().eq('id',id).eq('user_id',userId); fail(error); },
    async createPurchase(userId,tripId,input) { requireUser(userId); const row=await one<PurchaseRow>(db().from('purchases').insert({user_id:userId,trip_id:tripId,date:input.date,title:input.title.trim(),amount:input.amount,currency:currency(input.currency),location:input.location.trim(),recipient:input.recipient.trim(),notes:input.notes.trim(),organized:input.organized}).select('*').single(),'云端未返回购物记录。'); return mapPurchase(row); },
    async updatePurchase(userId,id,input) { requireUser(userId); const row=await one<PurchaseRow>(db().from('purchases').update({date:input.date,title:input.title.trim(),amount:input.amount,currency:currency(input.currency),location:input.location.trim(),recipient:input.recipient.trim(),notes:input.notes.trim(),organized:input.organized}).eq('id',id).eq('user_id',userId).select('*').single(),'找不到购物记录。'); return mapPurchase(row); },
    async deletePurchase(userId,id) { requireUser(userId); const {error}=await db().from('purchases').delete().eq('id',id).eq('user_id',userId); fail(error); },
    async createMediaNote(userId,tripId,input) { requireUser(userId); const row=await one<MediaRow>(db().from('media_notes').insert({user_id:userId,trip_id:tripId,trip_day_id:input.tripDayId,itinerary_item_id:input.itineraryItemId,media_type:input.mediaType,filename:input.filename.trim(),notes:input.notes.trim(),favorite:input.favorite}).select('*').single(),'云端未返回素材备注。'); return mapMediaNote(row); },
    async updateMediaNote(userId,id,input) { requireUser(userId); const row=await one<MediaRow>(db().from('media_notes').update({trip_day_id:input.tripDayId,itinerary_item_id:input.itineraryItemId,media_type:input.mediaType,filename:input.filename.trim(),notes:input.notes.trim(),favorite:input.favorite}).eq('id',id).eq('user_id',userId).select('*').single(),'找不到素材备注。'); return mapMediaNote(row); },
    async deleteMediaNote(userId,id) { requireUser(userId); const {error}=await db().from('media_notes').delete().eq('id',id).eq('user_id',userId); fail(error); },
    async createJournal(userId,tripId,input) { requireUser(userId); const row=await one<JournalRow>(db().from('journals').insert({user_id:userId,trip_id:tripId,trip_day_id:input.tripDayId,content:input.content.trim(),rating:input.rating}).select('*').single(),'云端未返回日记。'); return mapJournal(row); },
    async updateJournal(userId,id,input) { requireUser(userId); const row=await one<JournalRow>(db().from('journals').update({content:input.content.trim(),rating:input.rating}).eq('id',id).eq('user_id',userId).select('*').single(),'找不到日记。'); return mapJournal(row); },
    async deleteJournal(userId,id) { requireUser(userId); const {error}=await db().from('journals').delete().eq('id',id).eq('user_id',userId); fail(error); },
  };
}
export const supabaseArchiveRepository = createSupabaseArchiveRepository();
