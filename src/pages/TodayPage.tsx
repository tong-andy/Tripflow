import { Check, Navigation, Clock3, MapPin, Plus, SkipForward, WalletCards } from 'lucide-react';
import { useState } from 'react';
import { ExpenseForm } from '../components/archive/ArchiveForms';
import { ItineraryItemForm } from '../components/itinerary/ItineraryItemForm';
import { NoTripState } from '../components/ui/NoTripState';
import { getTodayItineraryState, getTodayTripDay, getTripStatus, getZonedClock, externalNavigationUrl } from '../domain/travelMode';
import { formatDayDate } from '../lib/formatters';
import { useArchive } from '../state/useArchive';
import { useNetwork } from '../state/useNetwork';
import { useTrips } from '../state/useTrips';
import { useProfile } from '../state/useProfile';
import type { MapProvider } from '../types/profile';
import type { ItineraryItem, ItineraryStatus } from '../types/trip';

const statusLabel:Record<ItineraryStatus,string>={planned:'计划中',completed:'已完成',skipped:'已跳过'};
export function TodayPage(){
 const {selectedTrip,addItineraryItem,updateItineraryStatus,isSaving}=useTrips();const archive=useArchive();const {profile}=useProfile();const {isOnline}=useNetwork();const [form,setForm]=useState<'itinerary'|'expense'|null>(null);
 if(!selectedTrip)return <NoTripState/>;
 const now=new Date(),trip=selectedTrip,status=getTripStatus(trip,now),day=getTodayTripDay(trip,now),clock=getZonedClock(now,trip.timezone);
 if(status!=='active'||!day)return <section className="rounded-3xl border border-line bg-white p-7 text-center shadow-card"><p className="text-sm font-semibold text-brand">TODAY</p><h1 className="mt-3 text-2xl font-bold">当前没有进行中的旅行日</h1><p className="mt-2 text-sm text-muted">{status==='upcoming'?'旅行尚未开始，先去行程页继续规划。':'这段旅行已经结束，可以前往记录页整理旅程。'}</p></section>;
 const items=trip.itineraryItems.filter(x=>x.tripDayId===day.id);const state=getTodayItineraryState(items,clock.minutes);
 return <section>
  <div className="rounded-3xl bg-ink p-6 text-white shadow-card sm:p-8"><p className="text-xs font-bold tracking-[0.18em] text-white/55">DAY {String(day.dayNumber).padStart(2,'0')}</p><h1 className="mt-2 text-3xl font-bold">今天 · {trip.destination}</h1><p className="mt-2 text-sm text-white/65">{formatDayDate(day.date)} · {trip.name} · {trip.timezone}</p></div>
  <div className="mt-5 grid grid-cols-2 gap-3"><button type="button" disabled={!isOnline||isSaving} onClick={()=>setForm(form==='itinerary'?null:'itinerary')} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-brand text-sm font-semibold text-white disabled:opacity-50"><Plus className="size-4"/>快速加行程</button><button type="button" disabled={!isOnline||archive.isSaving} onClick={()=>setForm(form==='expense'?null:'expense')} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-line bg-white text-sm font-semibold disabled:opacity-50"><WalletCards className="size-4"/>快速记花费</button></div>
  {!isOnline?<p className="mt-3 text-center text-xs text-amber-700">离线时只可查看当前页面，写入操作已停用。</p>:null}
  {form==='itinerary'?<ItineraryItemForm day={day} onCancel={()=>setForm(null)} onSubmit={async input=>{await addItineraryItem(input);setForm(null)}}/>:null}
  {form==='expense'?<ExpenseForm trip={trip} busy={archive.isSaving} onCancel={()=>setForm(null)} onSubmit={async input=>{await archive.saveExpense(input);setForm(null)}}/>:null}
  <div className="mt-6 grid gap-4 sm:grid-cols-2"><FocusCard label="当前候选" item={state.current}/><FocusCard label="下一站" item={state.next}/></div>
  <div className="mt-7 rounded-3xl border border-line bg-white p-5 shadow-card sm:p-7"><div className="flex items-center justify-between"><div><p className="text-xs font-bold text-brand">TODAY PLAN</p><h2 className="mt-1 text-xl font-bold">今天全部行程</h2></div><span className="text-xs text-muted">{items.length} 项</span></div>{items.filter(x=>x.time!==null).length?<ol className="mt-4 divide-y divide-line">{items.filter(x=>x.time!==null).sort((a,b)=>a.time!.localeCompare(b.time!)).map(item=><TodayItem key={item.id} item={item} mapProvider={profile?.defaultMapProvider??'system'} busy={!isOnline||isSaving} update={updateItineraryStatus}/>)}</ol>:<p className="py-10 text-center text-sm text-muted">今天还没有定时行程。</p>}
  {state.untimed.length?<><h3 className="mt-6 border-t border-line pt-5 text-sm font-bold">其他安排</h3><ol className="divide-y divide-line">{state.untimed.map(item=><TodayItem key={item.id} item={item} mapProvider={profile?.defaultMapProvider??'system'} busy={!isOnline||isSaving} update={updateItineraryStatus}/>)}</ol></>:null}</div>
 </section>;
}
function FocusCard({label,item}:{label:string;item?:ItineraryItem}){return <article className="rounded-2xl border border-line bg-white p-5 shadow-card"><p className="text-xs font-bold text-brand">{label}</p>{item?<><p className="mt-2 text-xl font-bold">{item.placeName}</p><p className="mt-1 flex items-center gap-1.5 text-xs text-muted"><Clock3 className="size-3.5"/>{item.time} · {item.durationMinutes} 分钟</p></>:<p className="mt-3 text-sm text-muted">暂无符合条件的行程</p>}</article>}
function TodayItem({item,mapProvider,busy,update}:{item:ItineraryItem;mapProvider:MapProvider;busy:boolean;update(id:string,status:ItineraryStatus):Promise<void>}){return <li className="py-4"><div className="flex items-start gap-3"><p className="w-12 shrink-0 pt-0.5 text-sm font-bold tabular-nums">{item.time??'灵活'}</p><div className="min-w-0 flex-1"><p className="font-semibold">{item.placeName}</p>{item.address?<p className="mt-1 flex items-start gap-1 text-xs text-muted"><MapPin className="mt-0.5 size-3 shrink-0"/>{item.address}</p>:null}<p className="mt-2 text-xs text-muted">{statusLabel[item.status]}</p></div>{item.address?<a aria-label={`导航到${item.placeName}`} href={externalNavigationUrl(item.address,mapProvider)} target="_blank" rel="noreferrer" className="grid size-9 shrink-0 place-items-center rounded-xl border border-line text-brand"><Navigation className="size-4"/></a>:null}</div>{item.status==='planned'?<div className="mt-3 flex gap-2 pl-15"><button disabled={busy} type="button" onClick={()=>void update(item.id,'completed').catch(()=>undefined)} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-soft px-3 py-2 text-xs font-semibold text-brand disabled:opacity-50"><Check className="size-3.5"/>完成</button><button disabled={busy} type="button" onClick={()=>void update(item.id,'skipped').catch(()=>undefined)} className="inline-flex items-center gap-1.5 rounded-lg bg-stone-100 px-3 py-2 text-xs font-semibold text-muted disabled:opacity-50"><SkipForward className="size-3.5"/>跳过</button></div>:null}</li>}
