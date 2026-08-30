import type { Expense, ExpenseCategory } from '../types/archive';
export const expenseCategoryLabels: Record<ExpenseCategory,string> = { flight:'机票', accommodation:'住宿', transport:'交通', food:'餐饮', shopping:'购物', ticket:'门票', other:'其他' };
export const mediaTypeLabels = { video:'视频', photo:'照片', audio:'音频', other:'其他' } as const;
export function totalsByCurrency(expenses: Expense[]) {
  return expenses.reduce<Record<string,number>>((totals,item)=>{totals[item.currency]=(totals[item.currency]??0)+item.amount;return totals;},{});
}
export function categoryTotals(expenses: Expense[]) {
  return expenses.reduce<Record<string,Record<string,number>>>((totals,item)=>{const category=totals[item.category]??{};category[item.currency]=(category[item.currency]??0)+item.amount;totals[item.category]=category;return totals;},{});
}
export function formatMoney(amount:number,currency:string){return new Intl.NumberFormat('zh-CN',{style:'currency',currency,currencyDisplay:'symbol'}).format(amount);}
