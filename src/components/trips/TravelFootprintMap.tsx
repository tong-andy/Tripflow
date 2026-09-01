import { MapPin } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Trip, TripDestination } from '../../types/trip';
import {
  GLOBAL_FOOTPRINT_VIEW_BOX,
  buildFocusViewBox,
  clusterFootprintPoints,
  pointIsInView,
  projectFootprintPoint,
  type FootprintViewBox,
} from './travelFootprintGeometry';

interface FootprintCity {
  key: string;
  destination: TripDestination;
  trips: Trip[];
}

type ViewMode = 'global' | 'focus';

function viewBoxValue(viewBox: FootprintViewBox) {
  return `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`;
}

function sameKeys(first: string[] | null, second: string[]) {
  if (!first || first.length !== second.length) return false;
  const firstSet = new Set(first);
  return second.every((key) => firstSet.has(key));
}

export function TravelFootprintMap({
  trips,
  onOpenTrip,
}: {
  trips: Trip[];
  onOpenTrip(tripId: string): void;
}) {
  const cities = useMemo(() => {
    const grouped = new Map<string, FootprintCity>();
    for (const trip of trips) {
      for (const destination of trip.destinations) {
        const key = `${destination.cityName}\u0000${destination.countryName}`;
        const current = grouped.get(key);
        if (current) current.trips.push(trip);
        else grouped.set(key, { key, destination, trips: [trip] });
      }
    }
    return [...grouped.values()];
  }, [trips]);
  const citySignature = cities.map((city) => city.key).sort().join('|');
  const [viewMode, setViewMode] = useState<ViewMode>('global');
  const [manualFocus, setManualFocus] = useState<{ signature: string; keys: string[] } | null>(null);
  const [selection, setSelection] = useState<{ signature: string; keys: string[] } | null>(null);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const manualFocusKeys = manualFocus?.signature === citySignature ? manualFocus.keys : null;
  const selectedKeys = selection?.signature === citySignature ? selection.keys : [];
  const effectiveViewMode = cities.length ? viewMode : 'global';

  const focusedCities = manualFocusKeys
    ? cities.filter((city) => manualFocusKeys.includes(city.key))
    : cities;
  const viewBox = effectiveViewMode === 'focus' && focusedCities.length
    ? buildFocusViewBox(focusedCities.map((city) => projectFootprintPoint(
      city.destination.longitude,
      city.destination.latitude,
    )))
    : GLOBAL_FOOTPRINT_VIEW_BOX;
  const visibleCities = cities.filter((city) => pointIsInView(
    projectFootprintPoint(city.destination.longitude, city.destination.latitude),
    viewBox,
  ));
  const mobileClusters = clusterFootprintPoints(
    visibleCities.map((city) => ({
      key: city.key,
      point: projectFootprintPoint(city.destination.longitude, city.destination.latitude),
      value: city,
    })),
    viewBox.width * 0.13,
  );
  const selectedCities = cities.filter((city) => selectedKeys.includes(city.key));

  function chooseViewMode(mode: ViewMode) {
    setViewMode(mode);
    setManualFocus(null);
    setSelection(null);
  }

  function chooseCluster(clusterCities: FootprintCity[]) {
    const keys = clusterCities.map((city) => city.key);
    if (clusterCities.length > 1 && !sameKeys(manualFocusKeys, keys)) {
      setViewMode('focus');
      setManualFocus({ signature: citySignature, keys });
      setSelection(null);
      return;
    }
    setSelection({ signature: citySignature, keys });
  }

  return (
    <section aria-label="世界旅行足迹" className="overflow-hidden rounded-3xl border border-line bg-white shadow-card">
      <div className="flex flex-col gap-4 border-b border-line px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-7">
        <div><p className="text-xs font-bold tracking-[0.14em] text-brand">TRAVEL FOOTPRINT</p><h2 className="mt-1 text-xl font-bold">世界旅行足迹</h2><p className="mt-1 text-xs text-muted">{cities.length} 个结构化城市</p></div>
        <div role="group" aria-label="足迹地图视图" className="inline-flex w-fit rounded-xl bg-canvas p-1">
          {(['global', 'focus'] as const).map((mode) => <button key={mode} type="button" disabled={mode === 'focus' && cities.length === 0} aria-pressed={effectiveViewMode === mode} onClick={() => chooseViewMode(mode)} className={`min-h-10 rounded-lg px-3 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${effectiveViewMode === mode ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink'}`}>{mode === 'global' ? '全球' : '聚焦足迹'}</button>)}
        </div>
      </div>
      <div className="bg-[#edf1ed] p-3 sm:p-5">
        <svg
          data-testid="travel-footprint-svg"
          data-view-mode={effectiveViewMode}
          data-view-box={viewBoxValue(viewBox)}
          viewBox={viewBoxValue(viewBox)}
          role="img"
          aria-label={`世界地图，显示 ${cities.length} 个去过的城市`}
          className="mx-auto aspect-[8/3] w-full max-w-[900px] overflow-hidden rounded-2xl bg-[#e8eeec]"
        >
          <image data-testid="world-country-boundaries" href="/data/world-110m.svg" x="0" y="0" width="1000" height="500" aria-hidden="true" />

          <g className="hidden sm:block">
            {visibleCities.map((city) => {
              const point = projectFootprintPoint(city.destination.longitude, city.destination.latitude);
              const active = selectedKeys.includes(city.key);
              const emphasized = active || city.key === hoveredKey;
              return (
                <g
                  key={city.key}
                  role="button"
                  tabIndex={0}
                  aria-label={`查看城市：${city.destination.cityName}`}
                  onClick={() => setSelection({ signature: citySignature, keys: [city.key] })}
                  onMouseEnter={() => setHoveredKey(city.key)}
                  onMouseLeave={() => setHoveredKey(null)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setSelection({ signature: citySignature, keys: [city.key] });
                    }
                  }}
                  className="cursor-pointer outline-none"
                >
                  <circle cx={point.x} cy={point.y} r="3%" fill="transparent" />
                  <circle cx={point.x} cy={point.y} r={emphasized ? '1.25%' : '1%'} fill="#28745a" opacity={emphasized ? 0.28 : 0.18} className="pointer-events-none transition-all" />
                  <circle cx={point.x} cy={point.y} r={emphasized ? '0.72%' : '0.58%'} fill={active ? '#1f2924' : '#28745a'} stroke="white" strokeWidth="2" vectorEffect="non-scaling-stroke" className="pointer-events-none transition-all" />
                  <title>{city.destination.cityName} · {city.destination.countryName}</title>
                </g>
              );
            })}
          </g>

          <g className="sm:hidden">
            {mobileClusters.map((cluster) => {
              const isCluster = cluster.values.length > 1;
              const active = cluster.values.some((city) => selectedKeys.includes(city.key));
              const label = isCluster
                ? `查看城市群：${cluster.values.map((city) => city.destination.cityName).join('、')}`
                : `查看城市：${cluster.values[0]?.destination.cityName ?? ''}`;
              return (
                <g key={cluster.key} role="button" tabIndex={0} aria-label={label} onClick={() => chooseCluster(cluster.values)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); chooseCluster(cluster.values); } }} className="cursor-pointer outline-none">
                  <circle cx={cluster.point.x} cy={cluster.point.y} r="9.5%" fill="transparent" />
                  <circle cx={cluster.point.x} cy={cluster.point.y} r={isCluster ? '4.8%' : '3.5%'} fill="#28745a" opacity={active ? 0.32 : 0.22} className="pointer-events-none" />
                  <circle cx={cluster.point.x} cy={cluster.point.y} r={isCluster ? '3.2%' : '2.15%'} fill={active ? '#1f2924' : '#28745a'} stroke="white" strokeWidth="2" vectorEffect="non-scaling-stroke" className="pointer-events-none" />
                  {isCluster ? <text x={cluster.point.x} y={cluster.point.y} textAnchor="middle" dominantBaseline="central" fill="white" fontSize="3.1%" fontWeight="800" className="pointer-events-none select-none">{cluster.values.length}</text> : null}
                  <title>{isCluster ? `${cluster.values.length} 个城市` : cluster.values[0]?.destination.cityName}</title>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {selectedCities.length === 1 ? (
        <div role="status" className="border-t border-line px-5 py-4 sm:px-7">
          <CityDetail city={selectedCities[0]!} onOpenTrip={onOpenTrip} />
        </div>
      ) : selectedCities.length > 1 ? (
        <div role="status" className="border-t border-line px-5 py-4 sm:px-7">
          <div className="flex items-center gap-2"><MapPin className="size-4 text-brand" /><p className="font-bold">{selectedCities.length} 个相邻城市</p></div>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {selectedCities.map((city) => <li key={city.key} className="min-w-0 rounded-xl bg-canvas p-3"><CityDetail city={city} onOpenTrip={onOpenTrip} compact /></li>)}
          </ul>
        </div>
      ) : cities.length ? <p className="border-t border-line px-5 py-3 text-xs text-muted sm:px-7">点击城市亮点查看相关旅行；手机端点击聚合点可先放大区域。</p> : <p className="border-t border-line px-5 py-5 text-sm text-muted sm:px-7">还没有结构化城市。编辑旅行并添加城市后，足迹会显示在这里。</p>}
    </section>
  );
}

function CityDetail({ city, onOpenTrip, compact = false }: { city: FootprintCity; onOpenTrip(tripId: string): void; compact?: boolean }) {
  return <div className="flex min-w-0 items-start gap-3"><span className={`grid shrink-0 place-items-center rounded-xl bg-brand-soft text-brand ${compact ? 'size-8' : 'size-9'}`}><MapPin className="size-4" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-baseline gap-x-2"><p className="font-bold">{city.destination.cityName} · {city.destination.countryName}</p><span className="text-xs text-muted">{city.trips.length} 趟关联旅行</span></div><div className="mt-2 flex min-w-0 flex-wrap gap-2">{city.trips.map((trip) => <button key={trip.id} type="button" onClick={() => onOpenTrip(trip.id)} className="max-w-full truncate rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-ink hover:bg-brand-soft hover:text-brand">{trip.name}</button>)}</div></div></div>;
}
