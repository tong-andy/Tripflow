import { MapPin, Search, Trash2 } from 'lucide-react';
import { useId, useMemo, useState } from 'react';
import { findCityOptions } from '../../data/cities';
import type { TripDestinationInput } from '../../types/trip';

function keyOf(destination: TripDestinationInput) {
  return `${destination.cityName}\u0000${destination.countryName}`;
}

export function DestinationManager({
  value,
  onChange,
}: {
  value: TripDestinationInput[];
  onChange(value: TripDestinationInput[]): void;
}) {
  const id = useId();
  const listId = `${id}-cities`;
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const selected = useMemo(() => new Set(value.map(keyOf)), [value]);
  const options = findCityOptions(query).filter((city) => !selected.has(keyOf(city)));

  return (
    <div>
      <label htmlFor={id} className="field-label">目的地城市</label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <input
          id={id}
          role="combobox"
          aria-label="搜索目的地城市"
          aria-expanded={open}
          aria-controls={listId}
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
          className="field-input pl-9"
          placeholder="搜索城市、国家或英文名"
        />
        {open ? (
          <div id={listId} role="listbox" className="absolute z-50 mt-2 max-h-64 w-full overflow-y-auto rounded-2xl border border-line bg-white p-2 shadow-xl">
            {options.length ? options.map((city) => (
              <button
                key={city.id}
                type="button"
                role="option"
                aria-selected="false"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onChange([...value, city]);
                  setQuery('');
                  setOpen(false);
                }}
                className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-canvas"
              >
                <MapPin className="size-4 shrink-0 text-brand" />
                <span><span className="font-semibold">{city.cityName}</span><span className="ml-2 text-xs text-muted">{city.countryName}</span></span>
              </button>
            )) : <p className="px-3 py-6 text-center text-sm text-muted">城市库中没有匹配项</p>}
          </div>
        ) : null}
      </div>
      <p className="mt-1.5 text-xs text-muted">从受控城市库选择；坐标会自动保存，不需要手动输入。</p>
      {value.length ? (
        <ol aria-label="已选目的地城市" className="mt-3 space-y-2">
          {value.map((destination, index) => (
            <li key={keyOf(destination)} className="flex min-h-11 items-center gap-3 rounded-xl border border-line bg-white px-3 py-2">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-bold text-brand">{index + 1}</span>
              <span className="min-w-0 flex-1 text-sm"><span className="font-semibold">{destination.cityName}</span><span className="ml-2 text-muted">{destination.countryName}</span></span>
              <button type="button" aria-label={`移除目的地：${destination.cityName}`} onClick={() => onChange(value.filter((_, itemIndex) => itemIndex !== index))} className="grid size-9 place-items-center rounded-lg text-muted hover:bg-red-50 hover:text-red-600"><Trash2 className="size-4" /></button>
            </li>
          ))}
        </ol>
      ) : <p className="mt-3 rounded-xl border border-dashed border-line px-4 py-3 text-sm text-muted">至少添加一个城市，新旅行才能显示在旅行足迹中。</p>}
    </div>
  );
}
