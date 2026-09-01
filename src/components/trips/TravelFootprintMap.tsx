import { MapPin } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Trip, TripDestination } from '../../types/trip';

interface FootprintCity {
  key: string;
  destination: TripDestination;
  trips: Trip[];
}

function project(longitude: number, latitude: number) {
  return {
    x: ((longitude + 180) / 360) * 1000,
    y: ((90 - latitude) / 180) * 500,
  };
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
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const selected = cities.find((city) => city.key === selectedKey) ?? null;

  return (
    <section aria-label="世界旅行足迹" className="overflow-hidden rounded-3xl border border-line bg-white shadow-card">
      <div className="flex flex-col gap-2 border-b border-line px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-7">
        <div><p className="text-xs font-bold tracking-[0.14em] text-brand">TRAVEL FOOTPRINT</p><h2 className="mt-1 text-xl font-bold">世界旅行足迹</h2></div>
        <p className="text-xs text-muted">{cities.length} 个结构化城市</p>
      </div>
      <div className="bg-[#edf1ed] p-3 sm:p-5">
        <svg viewBox="0 20 1000 440" role="img" aria-label={`世界地图，显示 ${cities.length} 个去过的城市`} className="mx-auto aspect-[1000/440] w-full max-w-[900px] overflow-visible rounded-2xl bg-[#e8eeec]">
          <image data-testid="world-country-boundaries" href="/data/world-110m.svg" x="0" y="0" width="1000" height="500" aria-hidden="true" />
          <g>
            {cities.map((city) => {
              const point = project(city.destination.longitude, city.destination.latitude);
              const active = city.key === selectedKey;
              const emphasized = active || city.key === hoveredKey;
              return (
                <g
                  key={city.key}
                  role="button"
                  tabIndex={0}
                  aria-label={`查看城市：${city.destination.cityName}`}
                  onClick={() => setSelectedKey(city.key)}
                  onMouseEnter={() => setHoveredKey(city.key)}
                  onMouseLeave={() => setHoveredKey(null)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setSelectedKey(city.key);
                    }
                  }}
                  className="cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  <circle cx={point.x} cy={point.y} r="16" fill="transparent" />
                  <circle cx={point.x} cy={point.y} r={emphasized ? 11 : 8} fill="#28745a" opacity={emphasized ? 0.28 : 0.18} className="transition-all" />
                  <circle cx={point.x} cy={point.y} r={emphasized ? 6 : 4.5} fill={active ? '#1f2924' : '#28745a'} stroke="white" strokeWidth="2" className="transition-all" />
                  <title>{city.destination.cityName} · {city.destination.countryName}</title>
                </g>
              );
            })}
          </g>
        </svg>
      </div>
      {selected ? (
        <div role="status" className="border-t border-line px-5 py-4 sm:px-7">
          <div className="flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand"><MapPin className="size-4" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-baseline gap-x-2"><p className="font-bold">{selected.destination.cityName} · {selected.destination.countryName}</p><span className="text-xs text-muted">{selected.trips.length} 趟关联旅行</span></div><div className="mt-2 flex flex-wrap gap-2">{selected.trips.map((trip) => <button key={trip.id} type="button" onClick={() => onOpenTrip(trip.id)} className="max-w-full truncate rounded-full bg-canvas px-3 py-1.5 text-xs font-semibold text-ink hover:bg-brand-soft hover:text-brand">{trip.name}</button>)}</div></div></div>
        </div>
      ) : cities.length ? <p className="border-t border-line px-5 py-3 text-xs text-muted sm:px-7">点击城市亮点查看相关旅行。</p> : <p className="border-t border-line px-5 py-5 text-sm text-muted sm:px-7">还没有结构化城市。编辑旅行并添加城市后，足迹会显示在这里。</p>}
    </section>
  );
}
