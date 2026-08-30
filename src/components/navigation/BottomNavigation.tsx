import { NavLink } from 'react-router-dom';
import { bottomNavigationItems } from '../../app/navigation';

export function BottomNavigation() {
  return (
    <nav
      aria-label="移动端主导航"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-md md:hidden"
    >
      <div className="mx-auto grid max-w-lg grid-cols-5">
        {bottomNavigationItems.map(({ shortLabel, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            replace
            className={({ isActive }) =>
              [
                'flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-semibold transition-colors',
                isActive ? 'text-brand' : 'text-muted',
              ].join(' ')
            }
          >
            <Icon className="size-5" strokeWidth={1.9} />
            {shortLabel}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
