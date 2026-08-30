import { Check, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import {
  PreparationItemForm,
} from '../components/preparation/PreparationItemForm';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { PageHeader } from '../components/ui/PageHeader';
import { NoTripState } from '../components/ui/NoTripState';
import { preparationCategoryLabels } from '../domain/preparation';
import { getTripStats } from '../domain/trips';
import { useTrips } from '../state/useTrips';
import type { PreparationItem } from '../types/trip';

export function PreparationPage() {
  const {
    selectedTrip,
    addPreparationItem,
    updatePreparationItem,
    togglePreparationItem,
    deletePreparationItem,
    isSaving,
  } = useTrips();
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PreparationItem>();
  const [deletingItem, setDeletingItem] = useState<PreparationItem>();

  if (!selectedTrip) {
    return <NoTripState />;
  }

  const stats = getTripStats(selectedTrip);
  const categories = Object.entries(preparationCategoryLabels);

  function closeForm() {
    setFormOpen(false);
    setEditingItem(undefined);
  }

  return (
    <section>
      <PageHeader
        eyebrow="Before the trip"
        title="准备"
        description="把出发前的重要事项整理清楚，不遗漏，也不过度准备。"
        action={
          <button
            type="button"
            disabled={isSaving}
            onClick={() => {
              setEditingItem(undefined);
              setFormOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink"
          >
            <Plus className="size-4" /> 添加事项
          </button>
        }
      />

      <div className="mt-7 rounded-2xl border border-line bg-white p-5 shadow-card">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-ink">整体准备进度</p>
            <p className="mt-1 text-xs text-muted">
              {stats.preparationCompleted} / {stats.preparationTotal} 项已完成
            </p>
          </div>
          <span className="text-2xl font-bold text-brand">{stats.preparationPercent}%</span>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-line">
          <div className="h-full rounded-full bg-brand" style={{ width: `${stats.preparationPercent}%` }} />
        </div>
      </div>

      {formOpen ? (
        <PreparationItemForm
          key={editingItem?.id ?? 'new-preparation-item'}
          item={editingItem}
          onCancel={closeForm}
          onSubmit={async (input) => {
            if (editingItem) {
              await updatePreparationItem(editingItem.id, input);
            } else {
              await addPreparationItem(input);
            }
            closeForm();
          }}
        />
      ) : null}

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {categories.map(([category, label]) => {
          const items = selectedTrip.preparationItems.filter(
            (item) => item.category === category,
          );
          const completed = items.filter((item) => item.completed).length;

          return (
          <article key={category} className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-bold text-ink">{label}</h2>
                <p className="mt-1 text-xs text-muted">{completed} / {items.length} 已完成</p>
              </div>
              <span className="rounded-full bg-canvas px-2.5 py-1 text-xs font-bold text-muted">{items.length}</span>
            </div>
            <ul className="mt-6 space-y-4">
              {items.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 text-sm">
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() =>
                        void togglePreparationItem(item.id).catch(() => undefined)
                      }
                      aria-label={`${item.completed ? '标记未完成' : '标记完成'}：${item.title}`}
                      className={`grid size-6 shrink-0 place-items-center rounded-full ${item.completed ? 'bg-brand text-white' : 'border border-line text-transparent hover:border-brand'}`}
                    >
                      <Check className="size-3.5" strokeWidth={3} />
                    </button>
                    <span className={`min-w-0 flex-1 ${item.completed ? 'text-muted line-through decoration-line' : 'text-ink'}`}>{item.title}</span>
                    <button
                      type="button"
                      disabled={isSaving}
                      aria-label={`编辑：${item.title}`}
                      onClick={() => {
                        setEditingItem(item);
                        setFormOpen(true);
                      }}
                      className="grid size-8 place-items-center rounded-lg text-muted hover:bg-canvas hover:text-ink"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={isSaving}
                      aria-label={`删除：${item.title}`}
                      onClick={() => setDeletingItem(item)}
                      className="grid size-8 place-items-center rounded-lg text-muted hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </li>
              ))}
              {items.length === 0 ? (
                <li className="rounded-2xl bg-canvas px-4 py-5 text-center text-xs text-muted">
                  这个分类还没有事项
                </li>
              ) : null}
            </ul>
          </article>
          );
        })}
      </div>

      <ConfirmDialog
        open={Boolean(deletingItem)}
        title="删除准备事项？"
        description={`“${deletingItem?.title ?? ''}”删除后无法恢复。`}
        onCancel={() => setDeletingItem(undefined)}
        busy={isSaving}
        onConfirm={() => {
          if (!deletingItem) return;
          void deletePreparationItem(deletingItem.id)
            .then(() => setDeletingItem(undefined))
            .catch(() => undefined);
        }}
      />
    </section>
  );
}
