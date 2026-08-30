import { Compass } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { navigationItems } from '../../app/navigation';

export function SidebarNavigation() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-line bg-white md:flex md:flex-col">
      <div className="flex h-20 items-center gap-3 px-7">
        <span className="grid size-10 place-items-center rounded-2xl bg-brand text-white shadow-sm shadow-brand/20">
          <Compass className="size-5" />
        </span>
        <div>
          <p className="text-lg font-bold tracking-tight text-ink">TripFlow</p>
          <p className="text-[11px] font-medium tracking-wide text-muted">
            让旅程清晰发生
          </p>
        </div>
      </div>

      <nav aria-label="主导航" className="flex-1 px-4 py-6">
        <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-muted/80">
          旅行工作台
        </p>
        <div className="space-y-1.5">
          {navigationItems.map(({ label, to, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-soft text-brand'
                    : 'text-muted hover:bg-canvas hover:text-ink',
                ].join(' ')
              }
            >
              <Icon className="size-[18px]" strokeWidth={1.9} />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>

      <div className="m-4 rounded-2xl border border-line bg-canvas p-4">
        <p className="text-xs font-semibold text-ink">下一段旅程</p>
        <p className="mt-1 text-xs leading-5 text-muted">大阪出发还有 18 天</p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line">
          <div className="h-full w-[68%] rounded-full bg-brand" />
        </div>
      </div>
    </aside>
  );
}

