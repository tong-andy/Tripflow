import { useState } from 'react';
import {
  categoryBreakdownForCurrency,
  expenseCategoryLabels,
  formatMoney,
  totalsByCurrency,
} from '../../domain/archive';
import type { Expense, ExpenseCategory, Purchase } from '../../types/archive';

const categoryColors: Record<ExpenseCategory, string> = {
  accommodation: '#256f58',
  food: '#d97706',
  transport: '#2563eb',
  shopping: '#c026d3',
  ticket: '#7c3aed',
  flight: '#0891b2',
  other: '#78716c',
};

export function ExpenseCategoryChart({
  expenses,
  purchases,
  budgetCurrency,
}: {
  expenses: Expense[];
  purchases: Purchase[];
  budgetCurrency: string | null;
}) {
  const totals = totalsByCurrency(expenses, purchases);
  const currencies = Object.keys(totals);
  const initialCurrency = budgetCurrency && currencies.includes(budgetCurrency)
    ? budgetCurrency
    : (currencies[0] ?? '');
  const [selectedCurrency, setSelectedCurrency] = useState(initialCurrency);
  const currency = currencies.includes(selectedCurrency) ? selectedCurrency : initialCurrency;
  const breakdown = currency
    ? categoryBreakdownForCurrency(expenses, purchases, currency)
    : [];

  if (!currencies.length) {
    return (
      <section aria-label="消费分类饼图" className="mt-8 rounded-3xl border border-dashed border-line bg-white px-5 py-12 text-center">
        <h2 className="font-bold">消费分类</h2>
        <p className="mt-2 text-sm text-muted">记录花费或计入花费的购物后，这里会显示分类占比。</p>
      </section>
    );
  }

  const segments = breakdown.map((item, index) => ({
    ...item,
    offset: breakdown.slice(0, index).reduce((sum, previous) => sum + previous.percent * 100, 0),
  }));
  return (
    <section aria-label="消费分类饼图" className="mt-8 rounded-3xl border border-line bg-white p-5 shadow-card sm:p-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="text-xs font-bold text-brand">SPENDING MIX</p><h2 className="mt-1 text-lg font-bold">消费分类饼图</h2></div>
        {currencies.length > 1 ? <div role="group" aria-label="图表币种" className="flex flex-wrap gap-2">{currencies.map((item) => <button key={item} type="button" aria-pressed={item===currency} onClick={()=>setSelectedCurrency(item)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${item===currency?'bg-ink text-white':'bg-canvas text-muted'}`}>{item}</button>)}</div> : <span className="rounded-full bg-canvas px-3 py-1.5 text-xs font-bold text-muted">{currency}</span>}
      </div>
      <div className="mt-6 grid items-center gap-7 sm:grid-cols-[minmax(180px,0.8fr)_1.2fr]">
        <div className="mx-auto size-48 max-w-full" role="img" aria-label={`${currency} 消费分类占比`}>
          <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden="true">
            <circle cx="60" cy="60" r="45" fill="none" stroke="#eef0ed" strokeWidth="22" />
            {segments.map((item) => <circle key={item.category} cx="60" cy="60" r="45" fill="none" stroke={categoryColors[item.category]} strokeWidth="22" pathLength="100" strokeDasharray={`${item.percent*100} ${100-item.percent*100}`} strokeDashoffset={-item.offset} />)}
          </svg>
        </div>
        <ul className="grid gap-3">
          {breakdown.map((item) => <li key={item.category} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 text-sm"><span className="size-3 rounded-full" style={{backgroundColor:categoryColors[item.category]}}/><span><span className="font-semibold">{expenseCategoryLabels[item.category]}</span><span className="ml-2 text-xs text-muted">{(item.percent*100).toFixed(1)}%</span></span><span className="font-bold tabular-nums">{formatMoney(item.amount,currency)}</span></li>)}
        </ul>
      </div>
    </section>
  );
}
