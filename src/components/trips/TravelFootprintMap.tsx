import { MapPin, Minus, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Trip, TripDestination } from '../../types/trip';
import {
  GLOBAL_FOOTPRINT_VIEW_BOX,
  buildFocusViewBox,
  clusterFootprintPoints,
  pointIsInView,
  projectFootprintPoint,
  zoomFootprintViewBox,
  type FootprintViewBox,
} from './travelFootprintGeometry';

interface FootprintCity {
  key: string;
  destination: TripDestination;
  trips: Trip[];
}

type ViewMode = 'global' | 'focus';

const mapLabels = [
  { label: 'NORTH AMERICA', x: 205, y: 155, kind: 'continent' },
  { label: 'SOUTH AMERICA', x: 335, y: 305, kind: 'continent' },
  { label: 'EUROPE', x: 535, y: 135, kind: 'continent' },
  { label: 'AFRICA', x: 535, y: 245, kind: 'continent' },
  { label: 'ASIA', x: 725, y: 155, kind: 'continent' },
  { label: 'OCEANIA', x: 865, y: 315, kind: 'continent' },
  { label: 'Canada', x: 210, y: 105, kind: 'country' },
  { label: 'United States', x: 225, y: 165, kind: 'country' },
  { label: 'Brazil', x: 350, y: 285, kind: 'country' },
  { label: 'China', x: 760, y: 185, kind: 'country' },
  { label: 'Australia', x: 845, y: 325, kind: 'country' },
] as const;

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
  const [zoom, setZoom] = useState(1);
  const [manualFocus, setManualFocus] = useState<{ signature: string; keys: string[] } | null>(null);
  const [selection, setSelection] = useState<{ signature: string; keys: string[] } | null>(null);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const manualFocusKeys = manualFocus?.signature === citySignature ? manualFocus.keys : null;
  const selectedKeys = selection?.signature === citySignature ? selection.keys : [];
  const effectiveViewMode = cities.length ? viewMode : 'global';

  const focusedCities = manualFocusKeys
    ? cities.filter((city) => manualFocusKeys.includes(city.key))
    : cities;
  const baseViewBox = effectiveViewMode === 'focus' && focusedCities.length
    ? buildFocusViewBox(focusedCities.map((city) => projectFootprintPoint(
      city.destination.longitude,
      city.destination.latitude,
    )))
    : GLOBAL_FOOTPRINT_VIEW_BOX;
  const viewBox = effectiveViewMode === 'focus' ? zoomFootprintViewBox(baseViewBox, zoom) : baseViewBox;
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
    setZoom(1);
    setManualFocus(null);
    setSelection(null);
  }

  function chooseCluster(clusterCities: FootprintCity[]) {
    const keys = clusterCities.map((city) => city.key);
    if (clusterCities.length > 1 && !sameKeys(manualFocusKeys, keys)) {
      setViewMode('focus');
      setManualFocus({ signature: citySignature, keys });
      setSelection({ signature: citySignature, keys });
      setZoom(3);
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
      <div className="relative bg-[#dfeae5] p-3 sm:p-5">
        <svg
          data-testid="travel-footprint-svg"
          data-view-mode={effectiveViewMode}
          data-view-box={viewBoxValue(viewBox)}
          viewBox={viewBoxValue(viewBox)}
          role="img"
          aria-label={`世界地图，显示 ${cities.length} 个去过的城市`}
          className="mx-auto aspect-[5/2] w-full max-w-[900px] overflow-hidden rounded-2xl bg-[#dbe9e5] shadow-inner"
        >
          <image data-testid="world-country-boundaries" href="/data/world-110m.svg" x="0" y="0" width="1000" height="500" aria-hidden="true" />

          {effectiveViewMode === 'global' ? <g aria-hidden="true" className="pointer-events-none select-none">{mapLabels.map((item) => <text key={item.label} x={item.x} y={item.y} textAnchor="middle" fill={item.kind === 'continent' ? '#49675c' : '#5f766d'} opacity={item.kind === 'continent' ? 0.78 : 0.68} fontSize={item.kind === 'continent' ? 13 : 8} fontWeight={item.kind === 'continent' ? 800 : 650} letterSpacing={item.kind === 'continent' ? 1.8 : 0}>{item.label}</text>)}</g> : null}

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
            {manualFocusKeys && selectedCities.length > 1 ? selectedCities.map((city, index) => {
              const original = projectFootprintPoint(city.destination.longitude, city.destination.latitude);
              const center = {
                x: selectedCities.reduce((sum, item) => sum + projectFootprintPoint(item.destination.longitude, item.destination.latitude).x, 0) / selectedCities.length,
                y: selectedCities.reduce((sum, item) => sum + projectFootprintPoint(item.destination.longitude, item.destination.latitude).y, 0) / selectedCities.length,
              };
              const angle = -Math.PI / 2 + (index * Math.PI * 2) / selectedCities.length;
              const radius = Math.min(viewBox.width, viewBox.height) * 0.28;
              const expanded = { x: center.x + Math.cos(angle) * radius, y: center.y + Math.sin(angle) * radius };
              return <g key={city.key} role="button" tabIndex={0} aria-label={`查看城市：${city.destination.cityName}`} onClick={() => setSelection({ signature: citySignature, keys: [city.key] })} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelection({ signature: citySignature, keys: [city.key] }); } }} className="cursor-pointer outline-none"><line x1={original.x} y1={original.y} x2={expanded.x} y2={expanded.y} stroke="#28745a" strokeWidth="1.5" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" opacity="0.55"/><circle cx={expanded.x} cy={expanded.y} r="8%" fill="transparent"/><circle cx={expanded.x} cy={expanded.y} r="3.2%" fill="#1f2924" stroke="white" strokeWidth="2" vectorEffect="non-scaling-stroke"/><text x={expanded.x} y={expanded.y + viewBox.height * 0.09} textAnchor="middle" fill="#1f2924" fontSize="4.2%" fontWeight="800" className="pointer-events-none">{city.destination.cityName}</text></g>;
            }) : mobileClusters.map((cluster) => {
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
        {effectiveViewMode === 'focus' ? <div role="group" aria-label="地图缩放" className="absolute bottom-5 right-5 flex overflow-hidden rounded-xl border border-line bg-white shadow-md sm:bottom-7 sm:right-7"><button type="button" aria-label="缩小地图" disabled={zoom <= 1} onClick={() => setZoom((value) => Math.max(1, value - 1))} className="grid size-11 place-items-center text-ink disabled:opacity-35"><Minus className="size-4"/></button><span className="grid min-w-10 place-items-center border-x border-line text-[11px] font-bold text-muted">{zoom.toFixed(0)}×</span><button type="button" aria-label="放大地图" disabled={zoom >= 4} onClick={() => setZoom((value) => Math.min(4, value + 1))} className="grid size-11 place-items-center text-ink disabled:opacity-35"><Plus className="size-4"/></button></div> : null}
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
      ) : cities.length ? <p className="border-t border-line px-5 py-3 text-xs text-muted sm:px-7">点击城市亮点查看相关旅行；手机端点击聚合点会放大并展开相邻城市。</p> : <p className="border-t border-line px-5 py-5 text-sm text-muted sm:px-7">还没有结构化城市。编辑旅行并添加城市后，足迹会显示在这里。</p>}
    </section>
  );
}

function CityDetail({ city, onOpenTrip, compact = false }: { city: FootprintCity; onOpenTrip(tripId: string): void; compact?: boolean }) {
  return <div className="flex min-w-0 items-start gap-3"><span className={`grid shrink-0 place-items-center rounded-xl bg-brand-soft text-brand ${compact ? 'size-8' : 'size-9'}`}><MapPin className="size-4" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-baseline gap-x-2"><p className="font-bold">{city.destination.cityName} · {city.destination.countryName}</p><span className="text-xs text-muted">{city.trips.length} 趟关联旅行</span></div><div className="mt-2 flex min-w-0 flex-wrap gap-2">{city.trips.map((trip) => <button key={trip.id} type="button" onClick={() => onOpenTrip(trip.id)} className="max-w-full truncate rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-ink hover:bg-brand-soft hover:text-brand">{trip.name}</button>)}</div></div></div>;
}
