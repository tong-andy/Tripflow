import { CalendarCheck2, LogOut, Plus } from 'lucide-react';
import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { BottomNavigation } from '../components/navigation/BottomNavigation';
import { SidebarNavigation } from '../components/navigation/SidebarNavigation';
import { NewTripDialog } from '../components/trips/NewTripDialog';
import { DataLoadingState } from '../components/ui/DataLoadingState';
import { useAuth } from '../state/useAuth';
import { useTrips } from '../state/useTrips';
import { useNetwork } from '../state/useNetwork';
import { getTripStatus } from '../domain/travelMode';

export interface AppShellContext {
  openNewTrip: () => void;
}

export function AppShell() {
  const [newTripOpen, setNewTripOpen] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const { user, signOut } = useAuth();
  const { isOnline } = useNetwork();
  const location = useLocation();
  const isMyTripsHome = location.pathname === '/trips';
  const navigate = useNavigate();
  const {
    trips,
    selectedTrip,
    selectedTripId,
    selectTrip,
    isLoading,
    isSaving,
    error,
    retry,
    clearError,
  } = useTrips();

  async function handleSignOut() {
    setSignOutError(null);
    try {
      await signOut();
    } catch (error) {
      setSignOutError(
        error instanceof Error ? error.message : '退出失败，请稍后重试。',
      );
    }
  }

  function handleTripChange(tripId: string) {
    const trip = trips.find((candidate) => candidate.id === tripId);
    if (!trip) return;
    selectTrip(tripId);
    const status = getTripStatus(trip);
    if (location.pathname === '/today' && status !== 'active') {
      navigate('/overview', { replace: true });
    } else if (location.pathname === '/overview') {
      navigate(`/overview?year=${trip.startDate.slice(0, 4)}`, { replace: true });
    }
  }

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <SidebarNavigation />

      <div className="md:pl-64">
        <div role="status" className={`sticky top-0 z-30 px-4 py-2 text-center text-xs font-semibold ${isOnline?'bg-brand-soft text-brand':'bg-amber-100 text-amber-800'}`}>{isOnline?'在线 · 云端数据可同步':'当前离线，无法获取最新数据；显示内容可能不是最新状态'}</div>
        <header className="sticky top-8 z-20 border-b border-line/80 bg-canvas/90 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-[1180px] items-center justify-between px-5 sm:px-8 lg:px-10">
            <div className="flex min-w-0 items-center gap-1">
              {!isMyTripsHome ? (
                <>
                  <label className="min-w-0">
                    <span className="sr-only">选择当前旅行</span>
                    <select
                      aria-label="选择当前旅行"
                      value={selectedTripId}
                      onChange={(event) => handleTripChange(event.target.value)}
                      disabled={trips.length === 0 || isLoading}
                      className="max-w-[130px] rounded-xl border-0 bg-transparent px-2 py-2 text-sm font-semibold text-ink outline-none hover:bg-white sm:max-w-sm"
                    >
                      {trips.map((trip) => (
                        <option key={trip.id} value={trip.id}>
                          {trip.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  {selectedTrip && getTripStatus(selectedTrip) === 'active' ? (
                    <Link replace to="/today" aria-label="打开今天" className="inline-flex min-h-10 items-center gap-1 rounded-xl bg-brand-soft px-2.5 text-xs font-bold text-brand md:hidden"><CalendarCheck2 className="size-4" />今天</Link>
                  ) : null}
                </>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden max-w-48 truncate text-xs text-muted lg:inline">
                {user?.email}
              </span>
              {!isMyTripsHome ? <button
                type="button"
                onClick={() => setNewTripOpen(true)}
                disabled={isLoading || isSaving}
                className="hidden items-center gap-2 rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-ink/90 sm:flex"
              >
                <Plus className="size-4" />
                新建旅行
              </button> : null}
              <button
                type="button"
                aria-label="退出登录"
                title="退出登录"
                onClick={() => void handleSignOut()}
                className="grid size-9 place-items-center rounded-full border border-line bg-white text-muted hover:text-ink"
              >
                <LogOut className="size-[17px]" />
              </button>
            </div>
          </div>
          {signOutError ? (
            <p role="alert" className="mx-auto max-w-[1180px] px-5 pb-2 text-xs text-red-700 sm:px-8 lg:px-10">
              {signOutError}
            </p>
          ) : null}
        </header>

        <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-[1180px] px-5 pb-28 pt-8 sm:px-8 md:pb-12 lg:px-10 lg:pt-10">
          {error ? (
            <div
              role="alert"
              className="mb-6 flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between"
            >
              <span>{error}</span>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => void retry()}
                  className="font-semibold underline underline-offset-2"
                >
                  重试
                </button>
                <button type="button" onClick={clearError} className="text-red-700">
                  关闭
                </button>
              </div>
            </div>
          ) : null}
          {!isOnline && trips.length === 0 && !isLoading ? (
            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center"><p className="font-bold text-amber-900">当前离线，无法获取最新数据</p><p className="mt-2 text-sm text-amber-800">TripFlow 应用壳已可使用，但本阶段不会缓存或离线同步业务数据。</p></div>
          ) : isLoading ? (
            <DataLoadingState />
          ) : (
            <Outlet context={{ openNewTrip: () => setNewTripOpen(true) }} />
          )}
        </main>
      </div>

      <BottomNavigation />
      <NewTripDialog
        open={newTripOpen}
        onClose={() => setNewTripOpen(false)}
      />
    </div>
  );
}
