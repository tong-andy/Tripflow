import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { supabaseArchiveRepository, type ArchiveRepository } from '../services/archiveRepository';
import type { ArchiveData, CreateExpenseInput, CreateJournalInput, CreateMediaNoteInput, CreatePurchaseInput, Expense, Journal, MediaNote, Purchase } from '../types/archive';
import { useAuth } from './useAuth';
import { useTrips } from './useTrips';
import { ArchiveContext } from './archiveContextValue';

const empty: ArchiveData = { expenses: [], purchases: [], mediaNotes: [], journals: [] };
export function ArchiveProvider({ children, repository = supabaseArchiveRepository }: { children: ReactNode; repository?: ArchiveRepository }) {
  const { user } = useAuth(); const { selectedTripId } = useTrips();
  const [data,setData]=useState(empty); const [isLoading,setLoading]=useState(false); const [isSaving,setSaving]=useState(false); const [error,setError]=useState<string|null>(null);
  const saving=useRef(false); const request=useRef(0);
  const load=useCallback(async()=>{ const userId=user?.id; const tripId=selectedTripId; const id=++request.current; if(!userId||!tripId){setData(empty);setLoading(false);return;} setLoading(true);setError(null);try{const next=await repository.loadArchive(userId,tripId);if(id===request.current)setData(next);}catch(e){if(id===request.current)setError(e instanceof Error?e.message:'归档数据加载失败。');}finally{if(id===request.current)setLoading(false);}},[repository,selectedTripId,user?.id]);
  useEffect(()=>{queueMicrotask(()=>void load());},[load]);
  async function mutate<T>(action:()=>Promise<T>, commit:(value:T)=>void){if(saving.current)throw new Error('正在保存上一项操作，请稍候。');saving.current=true;setSaving(true);setError(null);try{const value=await action();commit(value);}catch(e){setError(e instanceof Error?e.message:'归档数据操作失败。');throw e;}finally{saving.current=false;setSaving(false);}}
  function ids(){if(!user||!selectedTripId)throw new Error('请先选择一段旅行。');return [user.id,selectedTripId] as const;}
  const saveExpense=async(input:CreateExpenseInput,existing?:Expense)=>{const [u,t]=ids();await mutate(()=>existing?repository.updateExpense(u,existing.id,input):repository.createExpense(u,t,input),(v)=>setData(c=>({...c,expenses:[v,...c.expenses.filter(x=>x.id!==v.id)]})));};
  const savePurchase=async(input:CreatePurchaseInput,existing?:Purchase)=>{const [u,t]=ids();await mutate(()=>existing?repository.updatePurchase(u,existing.id,input):repository.createPurchase(u,t,input),(v)=>setData(c=>({...c,purchases:[v,...c.purchases.filter(x=>x.id!==v.id)]})));};
  const saveMediaNote=async(input:CreateMediaNoteInput,existing?:MediaNote)=>{const [u,t]=ids();await mutate(()=>existing?repository.updateMediaNote(u,existing.id,input):repository.createMediaNote(u,t,input),(v)=>setData(c=>({...c,mediaNotes:[v,...c.mediaNotes.filter(x=>x.id!==v.id)]})));};
  const saveJournal=async(input:CreateJournalInput,existing?:Journal)=>{const [u,t]=ids();await mutate(()=>existing?repository.updateJournal(u,existing.id,{content:input.content,rating:input.rating}):repository.createJournal(u,t,input),(v)=>setData(c=>({...c,journals:[v,...c.journals.filter(x=>x.id!==v.id)]})));};
  const deleteExpense=async(id:string)=>{const[u]=ids();await mutate(()=>repository.deleteExpense(u,id),()=>setData(c=>({...c,expenses:c.expenses.filter(x=>x.id!==id)})));};
  const deletePurchase=async(id:string)=>{const[u]=ids();await mutate(()=>repository.deletePurchase(u,id),()=>setData(c=>({...c,purchases:c.purchases.filter(x=>x.id!==id)})));};
  const deleteMediaNote=async(id:string)=>{const[u]=ids();await mutate(()=>repository.deleteMediaNote(u,id),()=>setData(c=>({...c,mediaNotes:c.mediaNotes.filter(x=>x.id!==id)})));};
  const deleteJournal=async(id:string)=>{const[u]=ids();await mutate(()=>repository.deleteJournal(u,id),()=>setData(c=>({...c,journals:c.journals.filter(x=>x.id!==id)})));};
  return <ArchiveContext.Provider value={{...data,isLoading,isSaving,error,retry:load,clearError:()=>setError(null),saveExpense,deleteExpense,savePurchase,deletePurchase,saveMediaNote,deleteMediaNote,saveJournal,deleteJournal}}>{children}</ArchiveContext.Provider>;
}
