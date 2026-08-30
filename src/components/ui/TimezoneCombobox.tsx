import { Check, ChevronDown, Search } from 'lucide-react';
import { useEffect, useId, useMemo, useState } from 'react';
import { findTimezoneOptions, timezoneLabel } from '../../domain/timezones';

export function TimezoneCombobox({
  label,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange(value: string): void;
  disabled?: boolean;
}) {
  const id = useId();
  const listId = `${id}-listbox`;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(() => timezoneLabel(value));
  const options = useMemo(() => findTimezoneOptions(open ? query : ''), [open, query]);

  useEffect(() => {
    queueMicrotask(() => setQuery(timezoneLabel(value)));
  }, [value]);

  const groups = options.reduce<Record<string, typeof options>>((result, option) => {
    (result[option.region] ??= []).push(option);
    return result;
  }, {});

  return (
    <div
      className="relative"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setOpen(false);
          setQuery(timezoneLabel(value));
        }
      }}
    >
      <label htmlFor={id} className="field-label">{label}</label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <input
          id={id}
          role="combobox"
          aria-label={label}
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          disabled={disabled}
          value={query}
          onFocus={(event) => { setOpen(true); event.currentTarget.select(); }}
          onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
          className="field-input pl-9 pr-9"
          placeholder="搜索城市或 IANA timezone"
        />
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
      </div>
      {open ? (
        <div id={listId} role="listbox" className="absolute z-50 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-line bg-white p-2 shadow-xl">
          {options.length ? Object.entries(groups).map(([region, items]) => (
            <div key={region} className="mb-2 last:mb-0">
              <p className="sticky top-0 bg-white px-3 py-2 text-[11px] font-bold text-muted">{region}</p>
              {items.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={option.value === value}
                  onClick={() => { onChange(option.value); setQuery(option.label); setOpen(false); }}
                  className="flex min-h-11 w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm hover:bg-canvas"
                >
                  <span>{option.label}</span>
                  {option.value === value ? <Check className="size-4 shrink-0 text-brand" /> : null}
                </button>
              ))}
            </div>
          )) : <p className="px-3 py-8 text-center text-sm text-muted">没有匹配的时区</p>}
        </div>
      ) : null}
    </div>
  );
}
