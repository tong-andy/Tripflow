import { useEffect, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTrips } from '../../state/useTrips';
import type { CreateTripInput } from '../../types/trip';
import { getTripStatus } from '../../domain/travelMode';
import { TimezoneCombobox } from '../ui/TimezoneCombobox';
import { useProfile } from '../../state/useProfile';

interface NewTripDialogProps {
  open: boolean;
  onClose: () => void;
}

const emptyForm: CreateTripInput = {
  name: '',
  destination: '',
  departureLocation: '',
  startDate: '',
  endDate: '',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Shanghai',
};

export function NewTripDialog({ open, onClose }: NewTripDialogProps) {
  const [form, setForm] = useState<CreateTripInput>(emptyForm);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addTrip, isSaving } = useTrips();
  const { profile } = useProfile();
  const navigate = useNavigate();

  useEffect(() => {
    if (!open || !profile?.defaultTimezone) return;
    queueMicrotask(() => setForm((current) =>
      current.name || current.destination || current.departureLocation || current.startDate || current.endDate
        ? current
        : { ...current, timezone: profile.defaultTimezone },
    ));
  }, [open, profile?.defaultTimezone]);

  if (!open) {
    return null;
  }

  function updateField(field: keyof CreateTripInput, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setError('');
  }

  function handleClose() {
    setForm({
      ...emptyForm,
      timezone: profile?.defaultTimezone ?? emptyForm.timezone,
    });
    setError('');
    onClose();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting || isSaving) return;

    setIsSubmitting(true);
    try {
      const trip = await addTrip(form);
      handleClose();
      const mobileActive = window.matchMedia('(max-width: 767px)').matches && getTripStatus(trip) === 'active';
      void navigate(mobileActive ? '/today' : '/overview', { replace: true });
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : '无法创建旅行',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-end bg-ink/35 p-0 sm:place-items-center sm:p-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) {
          handleClose();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-trip-title"
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:max-w-xl sm:rounded-3xl sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand">
              New journey
            </p>
            <h2 id="new-trip-title" className="mt-2 text-2xl font-bold text-ink">
              新建旅行
            </h2>
            <p className="mt-1 text-sm text-muted">
              填写基础信息后，TripFlow 会自动生成每天的行程页。
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="关闭新建旅行"
            className="grid size-9 shrink-0 place-items-center rounded-full border border-line text-muted hover:text-ink"
          >
            <X className="size-4" />
          </button>
        </div>

        <form className="mt-7 space-y-5" onSubmit={(event) => void handleSubmit(event)}>
          <label className="block">
            <span className="field-label">旅行名称</span>
            <input
              required
              autoFocus
              value={form.name}
              onChange={(event) => updateField('name', event.target.value)}
              className="field-input"
              placeholder="例如：关西秋日旅行"
            />
          </label>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="field-label">目的地</span>
              <input
                required
                value={form.destination}
                onChange={(event) =>
                  updateField('destination', event.target.value)
                }
                className="field-input"
                placeholder="例如：大阪、京都"
              />
            </label>
            <label className="block">
              <span className="field-label">出发地</span>
              <input
                required
                value={form.departureLocation}
                onChange={(event) =>
                  updateField('departureLocation', event.target.value)
                }
                className="field-input"
                placeholder="例如：上海"
              />
            </label>
          </div>

          <div>
            <TimezoneCombobox
              label="旅行时区"
              value={form.timezone ?? emptyForm.timezone ?? 'Asia/Shanghai'}
              onChange={(value) => updateField('timezone', value)}
            />
            <span className="mt-1.5 block text-xs text-muted">使用目的地的 IANA timezone，确保 Today 不会跨日错位。</span>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="field-label">出发日期</span>
              <input
                required
                type="date"
                value={form.startDate}
                onChange={(event) =>
                  updateField('startDate', event.target.value)
                }
                className="field-input"
              />
            </label>
            <label className="block">
              <span className="field-label">返程日期</span>
              <input
                required
                type="date"
                min={form.startDate || undefined}
                value={form.endDate}
                onChange={(event) => updateField('endDate', event.target.value)}
                className="field-input"
              />
            </label>
          </div>

          {error ? (
            <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-xl border border-line px-5 py-2.5 text-sm font-semibold text-ink"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isSaving}
              className="rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-white"
            >
              {isSubmitting ? '正在创建…' : '创建旅行'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
