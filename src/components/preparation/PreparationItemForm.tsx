import { useState, type FormEvent } from 'react';
import { preparationCategoryLabels } from '../../domain/preparation';
import type {
  CreatePreparationItemInput,
  PreparationItem,
} from '../../types/trip';

interface PreparationItemFormProps {
  item?: PreparationItem;
  initialCategory?: PreparationItem['category'];
  onSubmit: (input: CreatePreparationItemInput) => Promise<void>;
  onCancel: () => void;
}

export function PreparationItemForm({
  item,
  initialCategory,
  onSubmit,
  onCancel,
}: PreparationItemFormProps) {
  const [title, setTitle] = useState(item?.title ?? '');
  const [category, setCategory] = useState<PreparationItem['category']>(
    item?.category ?? initialCategory ?? 'transit',
  );
  const [notes, setNotes] = useState(item?.notes ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSubmit({ title: title.trim(), category, notes: notes.trim() });
    } catch {
      // TripProvider exposes the repository error in the shared error banner.
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className="mt-7 grid gap-4 rounded-2xl border border-brand/20 bg-brand-soft/60 p-4 sm:grid-cols-2"
    >
      <label>
        <span className="field-label">事项名称</span>
        <input
          required
          autoFocus
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="field-input"
          placeholder="例如：打印酒店确认单"
        />
      </label>
      <label>
        <span className="field-label">分类</span>
        <select
          value={category}
          onChange={(event) =>
            setCategory(event.target.value as PreparationItem['category'])
          }
          className="field-input"
        >
          {Object.entries(preparationCategoryLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="sm:col-span-2">
        <span className="field-label">备注（可选）</span>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          className="field-input min-h-24"
          placeholder="地址、提醒或需要补充的信息"
        />
      </label>
      <div className="flex gap-2 sm:col-span-2 sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink"
        >
          取消
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white"
        >
          {isSubmitting ? '保存中…' : item ? '保存' : '添加'}
        </button>
      </div>
    </form>
  );
}
