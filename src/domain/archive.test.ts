import { categoryTotals, totalsByCurrency } from './archive';
import type { Expense } from '../types/archive';
const expense=(amount:number,currency:string,category:Expense['category']='food'):Expense=>({id:crypto.randomUUID(),tripId:'trip',date:'2026-01-01',title:'item',amount,currency,category,notes:'',createdAt:'',updatedAt:''});
describe('archive totals',()=>{
 it('never combines different currencies',()=>{expect(totalsByCurrency([expense(100,'JPY'),expense(20,'CNY'),expense(50,'JPY')])).toEqual({JPY:150,CNY:20});});
 it('groups categories and currencies independently',()=>{expect(categoryTotals([expense(10,'CNY'),expense(20,'JPY')]).food).toEqual({CNY:10,JPY:20});});
});
