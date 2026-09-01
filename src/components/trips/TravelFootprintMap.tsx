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
  const selected = cities.find((city) => city.key === selectedKey) ?? null;

  return (
    <section aria-label="世界旅行足迹" className="overflow-hidden rounded-3xl border border-line bg-white shadow-card">
      <div className="flex flex-col gap-2 border-b border-line px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-7">
        <div><p className="text-xs font-bold tracking-[0.14em] text-brand">TRAVEL FOOTPRINT</p><h2 className="mt-1 text-xl font-bold">世界旅行足迹</h2></div>
        <p className="text-xs text-muted">{cities.length} 个结构化城市</p>
      </div>
      <div className="bg-[#edf1ed] p-3 sm:p-6">
        <svg viewBox="0 0 1000 500" role="img" aria-label={`世界地图，显示 ${cities.length} 个去过的城市`} className="h-auto w-full rounded-2xl bg-[#e8eeec]">
          <g fill="#cbd4cf" stroke="#b7c3bc" strokeWidth="2" aria-hidden="true">
            <path d="M48 112 95 73 173 57 233 81 279 126 250 157 210 166 187 201 138 194 112 165 71 151Z" />
            <path d="M226 205 269 213 300 252 286 302 267 347 246 410 218 367 207 311 184 269Z" />
            <path d="M450 100 491 72 548 83 580 112 616 116 647 92 699 96 735 119 792 112 846 142 904 155 930 190 895 211 842 203 810 232 760 217 714 237 674 211 629 218 603 184 555 177 522 151 478 158 438 137Z" />
            <path d="M493 189 548 180 592 219 603 273 578 326 546 379 508 343 486 294 456 241Z" />
            <path d="M821 326 864 304 918 330 943 371 911 403 851 397 805 365Z" />
            <path d="M923 417 944 405 959 427 942 447Z" />
            <path d="M349 68 371 52 390 67 376 91 351 88Z" />
            <path d="M759 240 775 229 788 247 779 273 763 265Z" />
          </g>
          <g>
            {cities.map((city) => {
              const point = project(city.destination.longitude, city.destination.latitude);
              const active = city.key === selectedKey;
              return (
                <g
                  key={city.key}
                  role="button"
                  tabIndex={0}
                  aria-label={`查看城市：${city.destination.cityName}`}
                  onClick={() => setSelectedKey(city.key)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setSelectedKey(city.key);
                    }
                  }}
                  className="cursor-pointer outline-none"
                >
                  <circle cx={point.x} cy={point.y} r={active ? 13 : 10} fill={active ? '#1f2924' : '#28745a'} opacity="0.2" />
                  <circle cx={point.x} cy={point.y} r={active ? 6 : 4.5} fill={active ? '#1f2924' : '#28745a'} stroke="white" strokeWidth="2" />
                  <title>{city.destination.cityName} · {city.destination.countryName}</title>
                </g>
              );
            })}
          </g>
        </svg>
      </div>
      {selected ? (
        <div role="status" className="border-t border-line px-5 py-4 sm:px-7">
          <div className="flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand"><MapPin className="size-4" /></span><div className="min-w-0 flex-1"><p className="font-bold">{selected.destination.cityName} · {selected.destination.countryName}</p><div className="mt-2 flex flex-wrap gap-2">{selected.trips.map((trip) => <button key={trip.id} type="button" onClick={() => onOpenTrip(trip.id)} className="rounded-full bg-canvas px-3 py-1.5 text-xs font-semibold text-ink hover:bg-brand-soft hover:text-brand">{trip.name}</button>)}</div></div></div>
        </div>
      ) : cities.length ? <p className="border-t border-line px-5 py-3 text-xs text-muted sm:px-7">点击城市亮点查看相关旅行。</p> : <p className="border-t border-line px-5 py-5 text-sm text-muted sm:px-7">还没有结构化城市。编辑旅行并添加城市后，足迹会显示在这里。</p>}
    </section>
  );
}
