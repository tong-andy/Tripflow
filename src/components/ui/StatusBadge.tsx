interface StatusBadgeProps {
  children: string;
  tone?: 'green' | 'amber' | 'gray';
}

const toneClasses = {
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/10',
  amber: 'bg-amber-50 text-amber-700 ring-amber-600/10',
  gray: 'bg-stone-100 text-stone-600 ring-stone-500/10',
};

export function StatusBadge({ children, tone = 'gray' }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}

