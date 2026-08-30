import { categoryBreakdownForCurrency, categoryTotals, spendingEntries, totalsByCurrency } from './archive';
import type { Expense, Purchase } from '../types/archive';
const expense=(amount:number,currency:string,category:Expense['category']='food'):Expense=>({id:crypto.randomUUID(),tripId:'trip',date:'2026-01-01',title:'item',amount,currency,category,notes:'',createdAt:'',updatedAt:''});
const purchase=(amount:number,currency:string,purchased=true,includeInExpenses=true):Purchase=>({id:crypto.randomUUID(),tripId:'trip',date:'2026-01-01',title:'item',amount,currency,location:'',recipient:'',notes:'',organized:false,purchased,includeInExpenses,createdAt:'',updatedAt:''});
describe('archive totals',()=>{
 it('never combines different currencies',()=>{expect(totalsByCurrency([expense(100,'JPY'),expense(20,'CNY'),expense(50,'JPY')])).toEqual({JPY:150,CNY:20});});
 it('groups categories and currencies independently',()=>{expect(categoryTotals([expense(10,'CNY'),expense(20,'JPY')]).food).toEqual({CNY:10,JPY:20});});
 it('includes only purchased shopping that is enabled for spending',()=>{expect(totalsByCurrency([expense(20000,'JPY'),expense(5000,'JPY')],[purchase(8000,'JPY'),purchase(9000,'JPY',false),purchase(1000,'JPY',true,false)])).toEqual({JPY:33000});});
 it('keeps shopping currencies separate and classifies them once',()=>{const expenses=[expense(500,'CNY','shopping')];const purchases=[purchase(500,'CNY'),purchase(100,'USD')];expect(totalsByCurrency(expenses,purchases)).toEqual({CNY:1000,USD:100});expect(categoryTotals(expenses,purchases).shopping).toEqual({CNY:1000,USD:100});expect(spendingEntries(expenses,purchases)).toHaveLength(3);});
 it('builds one-currency chart data from the unified spending entries',()=>{expect(categoryBreakdownForCurrency([expense(200,'JPY','food'),expense(100,'CNY','transport')],[purchase(800,'JPY')],'JPY')).toEqual([{category:'food',amount:200,percent:0.2},{category:'shopping',amount:800,percent:0.8}]);});
});
