import { X } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useTrips } from '../../state/useTrips';
import type { Trip, TripDestinationInput } from '../../types/trip';
import { TimezoneCombobox } from '../ui/TimezoneCombobox';
import { DestinationManager } from './DestinationManager';

export function EditTripDialog({ trip, onClose }: { trip: Trip; onClose(): void }) {
  const { updateTrip, replaceTripDestinations, isSaving } = useTrips();
  const [name, setName] = useState(trip.name);
  const [departureLocation, setDepartureLocation] = useState(trip.departureLocation);
  const [timezone, setTimezone] = useState(trip.timezone);
  const [destinations, setDestinations] = useState<TripDestinationInput[]>(trip.destinations);
  const [error, setError] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim() || !departureLocation.trim()) return;
    try {
      await replaceTripDestinations(trip.id, destinations);
      await updateTrip(trip.id, {
        name: name.trim(),
        departureLocation: departureLocation.trim(),
        timezone,
        destination: destinations.length
          ? destinations.map((destination) => destination.cityName).join(' · ')
          : trip.destination,
      });
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '旅行信息保存失败。');
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-ink/35 sm:place-items-center sm:p-6" role="presentation">
      <section role="dialog" aria-modal="true" aria-labelledby="edit-trip-title" className="max-h-[94vh] w-full overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:max-w-2xl sm:rounded-3xl sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div><p className="text-xs font-bold text-brand">CURRENT TRIP</p><h2 id="edit-trip-title" className="mt-2 text-2xl font-bold">编辑旅行</h2><p className="mt-1 text-sm text-muted">添加结构化城市后，这趟旅行会出现在旅行足迹地图。</p></div>
          <button type="button" aria-label="关闭编辑旅行" onClick={onClose} className="grid size-10 place-items-center rounded-full border border-line text-muted"><X className="size-4" /></button>
        </div>
        <form className="mt-7 space-y-5" onSubmit={(event) => void submit(event)}>
          <div className="grid gap-5 sm:grid-cols-2">
            <label><span className="field-label">旅行名称</span><input required value={name} onChange={(event) => setName(event.target.value)} className="field-input" /></label>
            <label><span className="field-label">出发地</span><input required value={departureLocation} onChange={(event) => setDepartureLocation(event.target.value)} className="field-input" /></label>
          </div>
          <DestinationManager value={destinations} onChange={setDestinations} />
          {destinations.length === 0 ? <p className="rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-800">旧旅行可以暂时保留原有目的地文本；添加城市后才会显示在地图上。</p> : null}
          <TimezoneCombobox label="旅行时区" value={timezone} onChange={setTimezone} />
          <p className="text-xs text-muted">旅行日期：{trip.startDate} — {trip.endDate}（本次编辑不重建已有旅行日）</p>
          {error ? <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
          <div className="flex justify-end gap-3"><button type="button" onClick={onClose} className="min-h-11 rounded-xl border border-line px-5 text-sm font-semibold">取消</button><button disabled={isSaving} className="min-h-11 rounded-xl bg-ink px-5 text-sm font-semibold text-white disabled:opacity-50">{isSaving ? '保存中…' : '保存旅行'}</button></div>
        </form>
      </section>
    </div>
  );
}
