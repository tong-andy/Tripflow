import { useState, type FormEvent } from 'react';
import { expenseCategoryLabels, mediaTypeLabels } from '../../domain/archive';
import type { CreateExpenseInput, CreateJournalInput, CreateMediaNoteInput, CreatePurchaseInput, Expense, Journal, MediaNote, Purchase } from '../../types/archive';
import type { Trip } from '../../types/trip';

const actions='flex gap-2 sm:justify-end'; const cancel='flex-1 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold'; const submit='flex-1 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60';
function FormActions({busy,editing,onCancel}:{busy:boolean;editing:boolean;onCancel():void}){return <div className={actions}><button type="button" className={cancel} onClick={onCancel}>取消</button><button type="submit" disabled={busy} className={submit}>{busy?'保存中…':editing?'保存':'添加'}</button></div>}

export function ExpenseForm({trip,item,busy,onCancel,onSubmit}:{trip:Trip;item?:Expense;busy:boolean;onCancel():void;onSubmit(v:CreateExpenseInput):Promise<void>}){
 const [v,setV]=useState<CreateExpenseInput>({date:item?.date??trip.startDate,title:item?.title??'',amount:item?.amount??0,currency:item?.currency??trip.budgetCurrency??'CNY',category:item?.category??'other',notes:item?.notes??''});
 async function submitForm(e:FormEvent){e.preventDefault();if(busy||!v.title.trim()||v.amount<0)return;await onSubmit({...v,currency:v.currency.toUpperCase()});}
 return <form onSubmit={e=>void submitForm(e).catch(()=>undefined)} className="mt-6 grid gap-4 rounded-2xl border border-brand/20 bg-brand-soft/50 p-4 sm:grid-cols-2 lg:grid-cols-3">
  <label><span className="field-label">日期</span><input aria-label="消费日期" required type="date" value={v.date} onChange={e=>setV({...v,date:e.target.value})} className="field-input"/></label>
  <label><span className="field-label">名称</span><input aria-label="消费名称" required value={v.title} onChange={e=>setV({...v,title:e.target.value})} className="field-input" placeholder="例如：晚餐"/></label>
  <label><span className="field-label">金额</span><input aria-label="消费金额" required min="0" step="0.01" type="number" value={v.amount} onChange={e=>setV({...v,amount:Number(e.target.value)})} className="field-input"/></label>
  <label><span className="field-label">币种</span><input aria-label="消费币种" required pattern="[A-Za-z]{3}" maxLength={3} value={v.currency} onChange={e=>setV({...v,currency:e.target.value.toUpperCase()})} className="field-input"/></label>
  <label><span className="field-label">分类</span><select aria-label="消费分类" value={v.category} onChange={e=>setV({...v,category:e.target.value as Expense['category']})} className="field-input">{Object.entries(expenseCategoryLabels).map(([x,l])=><option key={x} value={x}>{l}</option>)}</select></label>
  <label><span className="field-label">备注</span><input aria-label="消费备注" value={v.notes} onChange={e=>setV({...v,notes:e.target.value})} className="field-input"/></label><div className="sm:col-span-2 lg:col-span-3"><FormActions busy={busy} editing={!!item} onCancel={onCancel}/></div>
 </form>;
}

export function PurchaseForm({trip,item,busy,onCancel,onSubmit}:{trip:Trip;item?:Purchase;busy:boolean;onCancel():void;onSubmit(v:CreatePurchaseInput):Promise<void>}){
 const [v,setV]=useState<CreatePurchaseInput>({date:item?.date??trip.startDate,title:item?.title??'',amount:item?.amount??0,currency:item?.currency??trip.budgetCurrency??'CNY',location:item?.location??'',recipient:item?.recipient??'',notes:item?.notes??'',organized:item?.organized??false});
 return <form onSubmit={e=>{e.preventDefault();if(!busy)void onSubmit({...v,currency:v.currency.toUpperCase()}).catch(()=>undefined)}} className="mt-6 grid gap-4 rounded-2xl border border-brand/20 bg-brand-soft/50 p-4 sm:grid-cols-2 lg:grid-cols-3">
 {([['购物日期','date','date'],['物品名称','title','text'],['金额','amount','number'],['币种','currency','text'],['地点','location','text'],['收礼人','recipient','text']] as const).map(([label,key,type])=><label key={key}><span className="field-label">{label}</span><input aria-label={label} required={['date','title','amount','currency'].includes(key)} min={key==='amount'?'0':undefined} step={key==='amount'?'0.01':undefined} maxLength={key==='currency'?3:undefined} type={type} value={v[key]} onChange={e=>setV({...v,[key]:key==='amount'?Number(e.target.value):key==='currency'?e.target.value.toUpperCase():e.target.value})} className="field-input"/></label>)}
 <label className="sm:col-span-2 lg:col-span-3"><span className="field-label">备注</span><textarea aria-label="购物备注" value={v.notes} onChange={e=>setV({...v,notes:e.target.value})} className="field-input min-h-20"/></label><div className="sm:col-span-2 lg:col-span-3"><FormActions busy={busy} editing={!!item} onCancel={onCancel}/></div>
 </form>;
}

export function MediaForm({trip,item,busy,onCancel,onSubmit}:{trip:Trip;item?:MediaNote;busy:boolean;onCancel():void;onSubmit(v:CreateMediaNoteInput):Promise<void>}){
 const [v,setV]=useState<CreateMediaNoteInput>({tripDayId:item?.tripDayId??null,itineraryItemId:item?.itineraryItemId??null,mediaType:item?.mediaType??'photo',filename:item?.filename??'',notes:item?.notes??'',favorite:item?.favorite??false});
 return <form onSubmit={e=>{e.preventDefault();if(!busy)void onSubmit(v).catch(()=>undefined)}} className="mt-6 grid gap-4 rounded-2xl border border-brand/20 bg-brand-soft/50 p-4 sm:grid-cols-2">
 <label><span className="field-label">素材名称 / 文件名</span><input aria-label="素材名称" required value={v.filename} onChange={e=>setV({...v,filename:e.target.value})} className="field-input"/></label>
 <label><span className="field-label">类型</span><select aria-label="素材类型" value={v.mediaType} onChange={e=>setV({...v,mediaType:e.target.value as MediaNote['mediaType']})} className="field-input">{Object.entries(mediaTypeLabels).map(([x,l])=><option key={x} value={x}>{l}</option>)}</select></label>
 <label><span className="field-label">关联日期（可选）</span><select aria-label="关联日期" value={v.tripDayId??''} onChange={e=>setV({...v,tripDayId:e.target.value||null,itineraryItemId:null})} className="field-input"><option value="">不关联</option>{trip.days.map(d=><option key={d.id} value={d.id}>Day {d.dayNumber} · {d.date}</option>)}</select></label>
 <label><span className="field-label">关联行程（可选）</span><select aria-label="关联行程" value={v.itineraryItemId??''} onChange={e=>setV({...v,itineraryItemId:e.target.value||null})} className="field-input"><option value="">不关联</option>{trip.itineraryItems.filter(x=>!v.tripDayId||x.tripDayId===v.tripDayId).map(x=><option key={x.id} value={x.id}>{x.time ?? '灵活'} · {x.placeName}</option>)}</select></label>
 <label className="sm:col-span-2"><span className="field-label">素材备注</span><textarea aria-label="素材备注" value={v.notes} onChange={e=>setV({...v,notes:e.target.value})} className="field-input min-h-20"/></label><div className="sm:col-span-2"><FormActions busy={busy} editing={!!item} onCancel={onCancel}/></div>
 </form>;
}

export function JournalForm({trip,item,dayId,busy,onCancel,onSubmit}:{trip:Trip;item?:Journal;dayId?:string;busy:boolean;onCancel():void;onSubmit(v:CreateJournalInput):Promise<void>}){
 const [v,setV]=useState<CreateJournalInput>({tripDayId:item?.tripDayId??dayId??trip.days[0]?.id??'',content:item?.content??'',rating:item?.rating??null});
 return <form onSubmit={e=>{e.preventDefault();if(!busy)void onSubmit(v).catch(()=>undefined)}} className="mt-6 grid gap-4 rounded-2xl border border-brand/20 bg-brand-soft/50 p-4 sm:grid-cols-[1fr_180px]">
 <label><span className="field-label">旅行日期</span><select aria-label="日记日期" disabled={!!item} value={v.tripDayId} onChange={e=>setV({...v,tripDayId:e.target.value})} className="field-input">{trip.days.map(d=><option key={d.id} value={d.id}>Day {d.dayNumber} · {d.date}</option>)}</select></label>
 <label><span className="field-label">评分（可选）</span><select aria-label="日记评分" value={v.rating??''} onChange={e=>setV({...v,rating:e.target.value?Number(e.target.value):null})} className="field-input"><option value="">不评分</option>{[1,2,3,4,5].map(x=><option key={x} value={x}>{x} 星</option>)}</select></label>
 <label className="sm:col-span-2"><span className="field-label">日记内容</span><textarea aria-label="日记内容" required value={v.content} onChange={e=>setV({...v,content:e.target.value})} className="field-input min-h-40" placeholder="记录今天发生的事……"/></label><div className="sm:col-span-2"><FormActions busy={busy} editing={!!item} onCancel={onCancel}/></div>
 </form>;
}
