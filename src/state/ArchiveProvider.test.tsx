import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import type { ArchiveRepository } from '../services/archiveRepository';
import { ArchiveProvider } from './ArchiveProvider';
import { useArchive } from './useArchive';

vi.mock('./useAuth',()=>({useAuth:()=>({user:{id:'user-1'}})}));
vi.mock('./useTrips',()=>({useTrips:()=>({selectedTripId:'trip-1'})}));
const row={id:'expense-1',tripId:'trip-1',date:'2026-01-01',title:'晚餐',amount:80,currency:'CNY',category:'food' as const,notes:'',createdAt:'now',updatedAt:'now'};
function repository():ArchiveRepository{return {loadArchive:vi.fn().mockResolvedValue({expenses:[],purchases:[],mediaNotes:[],journals:[]}),createExpense:vi.fn().mockResolvedValue(row),updateExpense:vi.fn(),deleteExpense:vi.fn().mockResolvedValue(undefined),createPurchase:vi.fn(),updatePurchase:vi.fn(),deletePurchase:vi.fn(),createMediaNote:vi.fn(),updateMediaNote:vi.fn(),deleteMediaNote:vi.fn(),createJournal:vi.fn(),updateJournal:vi.fn(),deleteJournal:vi.fn()};}
function Probe(){const a=useArchive();return <><span>{a.isLoading?'加载中':a.expenses.map(x=>x.title).join(',')||'空'}</span>{a.error?<span>{a.error}</span>:null}<button onClick={()=>void a.saveExpense({date:row.date,title:row.title,amount:row.amount,currency:row.currency,category:row.category,notes:''}).catch(()=>undefined)}>新增</button><button onClick={()=>void a.deleteExpense(row.id).catch(()=>undefined)}>删除</button></>}
describe('ArchiveProvider',()=>{
 it('loads and commits successful cloud mutations',async()=>{const repo=repository();const user=userEvent.setup();render(<ArchiveProvider repository={repo}><Probe/></ArchiveProvider>);expect(await screen.findByText('空')).toBeInTheDocument();await user.click(screen.getByRole('button',{name:'新增'}));expect(await screen.findByText('晚餐')).toBeInTheDocument();expect(repo.createExpense).toHaveBeenCalledWith('user-1','trip-1',expect.objectContaining({title:'晚餐'}));await user.click(screen.getByRole('button',{name:'删除'}));await waitFor(()=>expect(screen.getByText('空')).toBeInTheDocument());});
 it('does not change local data when a write fails',async()=>{const repo=repository();vi.mocked(repo.createExpense).mockRejectedValue(new Error('网络失败'));const user=userEvent.setup();render(<ArchiveProvider repository={repo}><Probe/></ArchiveProvider>);await screen.findByText('空');await user.click(screen.getByRole('button',{name:'新增'}));expect(screen.getByText('空')).toBeInTheDocument();expect(screen.getByText('网络失败')).toBeInTheDocument();});
});
