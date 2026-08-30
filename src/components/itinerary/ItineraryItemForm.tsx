import { useState, type FormEvent } from 'react';
import type {
  CreateItineraryItemInput,
  ItineraryStatus,
  ItineraryItem,
  TripDay,
} from '../../types/trip';

interface ItineraryItemFormProps {
  day: TripDay;
  item?: ItineraryItem;
  onSubmit: (input: CreateItineraryItemInput) => Promise<void>;
  onCancel: () => void;
}

export function ItineraryItemForm({
  day,
  item,
  onSubmit,
  onCancel,
}: ItineraryItemFormProps) {
  const [time, setTime] = useState(item ? (item.time ?? '') : '09:00');
  const [placeName, setPlaceName] = useState(item?.placeName ?? '');
  const [address, setAddress] = useState(item?.address ?? '');
  const [durationMinutes, setDurationMinutes] = useState(item?.durationMinutes ?? 60);
  const [notes, setNotes] = useState(item?.notes ?? '');
  const [status, setStatus] = useState<ItineraryStatus>(item?.status ?? 'planned');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!placeName.trim() || durationMinutes < 1 || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        tripDayId: day.id,
        time: time || null,
        placeName,
        address,
        durationMinutes,
        notes,
        status,
      });
    } catch {
      // TripProvider exposes the repository error in the shared error banner.
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className="mt-6 rounded-3xl border border-brand/20 bg-brand-soft/55 p-5 sm:p-6"
    >
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <label>
          <span className="field-label">时间（可选）</span>
          <input
            type="time"
            value={time}
            onChange={(event) => setTime(event.target.value)}
            className="field-input"
          />
        </label>
        <label className="lg:col-span-2">
          <span className="field-label">地址（可选）</span>
          <input
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            className="field-input"
            placeholder="用于调用外部地图导航"
          />
        </label>
        <label className="lg:col-span-2">
          <span className="field-label">地点名称</span>
          <input
            required
            autoFocus={!item}
            value={placeName}
            onChange={(event) => setPlaceName(event.target.value)}
            className="field-input"
            placeholder="例如：清水寺"
          />
        </label>
        <label>
          <span className="field-label">预计停留（分钟）</span>
          <input
            required
            min="1"
            max="1440"
            type="number"
            value={durationMinutes}
            onChange={(event) => setDurationMinutes(event.target.valueAsNumber)}
            className="field-input"
          />
        </label>
        <label className="sm:col-span-2 lg:col-span-3">
          <span className="field-label">备注</span>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className="field-input min-h-24 resize-y"
            placeholder="交通方式、预约信息或其他提醒"
          />
        </label>
        <label>
          <span className="field-label">状态</span>
          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as ItineraryStatus)
            }
            className="field-input"
          >
            <option value="planned">计划中</option>
            <option value="completed">已完成</option>
            <option value="skipped">已跳过</option>
          </select>
        </label>
      </div>
      <div className="mt-5 flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink"
        >
          取消
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white"
        >
          {isSubmitting ? '保存中…' : item ? '保存修改' : '添加行程'}
        </button>
      </div>
    </form>
  );
}
