import type { Expense, ExpenseCategory, Purchase } from '../types/archive';
export const expenseCategoryLabels: Record<ExpenseCategory,string> = { flight:'机票', accommodation:'住宿', transport:'交通', food:'餐饮', shopping:'购物', ticket:'门票', other:'其他' };
export const mediaTypeLabels = { video:'视频', photo:'照片', audio:'音频', other:'其他' } as const;

export interface SpendingEntry {
  source: 'expense' | 'purchase';
  id: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
}

export function spendingEntries(expenses: Expense[], purchases: Purchase[] = []): SpendingEntry[] {
  return [
    ...expenses.map((item) => ({ source: 'expense' as const, id: item.id, amount: item.amount, currency: item.currency, category: item.category })),
    ...purchases
      .filter((item) => item.purchased && item.includeInExpenses)
      .map((item) => ({ source: 'purchase' as const, id: item.id, amount: item.amount, currency: item.currency, category: 'shopping' as const })),
  ];
}

export function totalsByCurrency(expenses: Expense[], purchases: Purchase[] = []) {
  return spendingEntries(expenses, purchases).reduce<Record<string,number>>((totals,item)=>{totals[item.currency]=(totals[item.currency]??0)+item.amount;return totals;},{});
}
export function categoryTotals(expenses: Expense[], purchases: Purchase[] = []) {
  return spendingEntries(expenses, purchases).reduce<Record<string,Record<string,number>>>((totals,item)=>{const category=totals[item.category]??{};category[item.currency]=(category[item.currency]??0)+item.amount;totals[item.category]=category;return totals;},{});
}
export function formatMoney(amount:number,currency:string){return new Intl.NumberFormat('zh-CN',{style:'currency',currency,currencyDisplay:'symbol'}).format(amount);}
