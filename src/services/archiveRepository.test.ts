import type { SupabaseClient } from '@supabase/supabase-js';
import { vi } from 'vitest';
import type { Database } from '../types/database';
import { createSupabaseArchiveRepository, mapExpense, mapPurchase } from './archiveRepository';

interface Result {data: unknown;error:{message:string}|null}
function clientWith(responses:Record<string,Result[]>){const builders:Record<string,unknown>[]=[];const from=vi.fn((table:string)=>{const result=responses[table]?.shift()??{data:[],error:null};const b:Record<string,unknown>={};for(const method of ['select','eq','order','insert','update','delete','single'])b[method]=vi.fn(()=>b);b.then=(ok:(v:Result)=>unknown,bad:(e:unknown)=>unknown)=>Promise.resolve(result).then(ok,bad);builders.push({table,b});return b;});return {client:{from} as unknown as SupabaseClient<Database>,builders};}
const base={id:'expense-1',trip_id:'trip-1',user_id:'user-1',date:'2026-01-01',title:'晚餐',amount:120,currency:'JPY',category:'food',notes:'',created_at:'now',updated_at:'now'};
describe('archive repository',()=>{
 it('loads every archive table scoped by user and trip',async()=>{const {client,builders}=clientWith({expenses:[{data:[base],error:null}],purchases:[{data:[],error:null}],media_notes:[{data:[],error:null}],journals:[{data:[],error:null}]});const data=await createSupabaseArchiveRepository(client).loadArchive('user-1','trip-1');expect(data.expenses[0]).toMatchObject({amount:120,category:'food'});for(const entry of builders){const b=entry.b as {eq:ReturnType<typeof vi.fn>};expect(b.eq).toHaveBeenCalledWith('user_id','user-1');expect(b.eq).toHaveBeenCalledWith('trip_id','trip-1');}});
 it('normalizes currency on insert and maps numeric values',async()=>{const {client,builders}=clientWith({expenses:[{data:base,error:null}]});const item=await createSupabaseArchiveRepository(client).createExpense('user-1','trip-1',{date:'2026-01-01',title:' 晚餐 ',amount:120,currency:'jpy',category:'food',notes:''});const insert=(builders[0]?.b as {insert:ReturnType<typeof vi.fn>}).insert;expect(insert).toHaveBeenCalledWith(expect.objectContaining({title:'晚餐',currency:'JPY'}));expect(item.amount).toBe(120);});
 it('rejects unauthenticated access',async()=>{const {client}=clientWith({});await expect(createSupabaseArchiveRepository(client).loadArchive('','trip')).rejects.toThrow('登录状态已失效');});
 it('rejects invalid cloud categories',()=>{expect(()=>mapExpense({...base,category:'invalid'})).toThrow('分类无效');});
 it('maps purchase spending flags from cloud rows',()=>{expect(mapPurchase({...base,title:'相机',location:'东京',recipient:'',organized:false,purchased:true,include_in_expenses:false} as Database['public']['Tables']['purchases']['Row'])).toMatchObject({purchased:true,includeInExpenses:false});});
});
