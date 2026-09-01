import { Check, ChevronDown, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { PreparationItemForm } from '../components/preparation/PreparationItemForm';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { NoTripState } from '../components/ui/NoTripState';
import { PageHeader } from '../components/ui/PageHeader';
import {
  preparationCategories,
  preparationCategoryLabels,
} from '../domain/preparation';
import { getTripStats } from '../domain/trips';
import { useTrips } from '../state/useTrips';
import type { PreparationCategory, PreparationItem } from '../types/trip';

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
  const [initialCategory, setInitialCategory] = useState<PreparationCategory>();
  const [editingItem, setEditingItem] = useState<PreparationItem>();
  const [deletingItem, setDeletingItem] = useState<PreparationItem>();

  if (!selectedTrip) return <NoTripState />;

  const stats = getTripStats(selectedTrip);

  function openCreate(category?: PreparationCategory) {
    setEditingItem(undefined);
    setInitialCategory(category);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingItem(undefined);
    setInitialCategory(undefined);
  }

  return (
    <section>
      <PageHeader
        eyebrow="Before the trip"
        title="准备"
        description="按出行环节整理清单；已有事项会保留在对应的新分类中。"
        action={
          <button
            type="button"
            disabled={isSaving}
            onClick={() => openCreate()}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 text-sm font-semibold"
          >
            <Plus className="size-4" /> 新增准备事项
          </button>
        }
      />

      <div className="mt-7 rounded-2xl border border-line bg-white p-5 shadow-card">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-bold">准备 {stats.preparationCompleted} / {stats.preparationTotal} 已完成</p>
            <p className="mt-1 text-xs text-muted">所有分类的整体完成度</p>
          </div>
          <span className="text-2xl font-bold text-brand">{stats.preparationPercent}%</span>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-line">
          <div className="h-full rounded-full bg-brand" style={{ width: `${stats.preparationPercent}%` }} />
        </div>
      </div>

      {formOpen ? (
        <PreparationItemForm
          key={editingItem?.id ?? initialCategory ?? 'new'}
          item={editingItem}
          initialCategory={initialCategory}
          onCancel={closeForm}
          onSubmit={async (input) => {
            if (editingItem) await updatePreparationItem(editingItem.id, input);
            else await addPreparationItem(input);
            closeForm();
          }}
        />
      ) : null}

      <div className="mt-6 space-y-3">
        {preparationCategories.map((category) => {
          const items = selectedTrip.preparationItems.filter((item) => item.category === category);
          const completed = items.filter((item) => item.completed).length;
          return (
            <details key={category} open className="group rounded-2xl border border-line bg-white shadow-card">
              <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 px-5 sm:px-6">
                <div>
                  <h2 className="font-bold">{preparationCategoryLabels[category]}</h2>
                  <p className="mt-0.5 text-xs text-muted">{completed} / {items.length} 已完成</p>
                </div>
                <ChevronDown className="size-4 text-muted transition-transform group-open:rotate-180" />
              </summary>
              <div className="border-t border-line p-3 sm:p-5">
                <ul data-testid={`preparation-grid-${category}`} className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
                  {items.map((item) => (
                      <li key={item.id} className={`flex min-h-24 items-start gap-3 rounded-xl border p-3 transition-colors ${item.completed ? 'border-line/70 bg-canvas/70' : 'border-line bg-white'}`}>
                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={() => void togglePreparationItem(item.id).catch(() => undefined)}
                          aria-label={`${item.completed ? '标记未完成' : '标记完成'}：${item.title}`}
                          className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-full ${item.completed ? 'bg-brand text-white' : 'border border-line text-transparent hover:border-brand'}`}
                        >
                          <Check className="size-4" strokeWidth={3} />
                        </button>
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm ${item.completed ? 'text-muted line-through' : 'font-medium'}`}>{item.title}</p>
                          {item.notes ? <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted">{item.notes}</p> : null}
                        </div>
                        <div className="-mr-1 -mt-1 flex shrink-0"><button type="button" aria-label={`编辑：${item.title}`} onClick={() => { setEditingItem(item); setInitialCategory(undefined); setFormOpen(true); }} className="grid size-10 place-items-center rounded-lg text-muted hover:bg-canvas hover:text-ink"><Pencil className="size-4" /></button>
                        <button type="button" aria-label={`删除：${item.title}`} onClick={() => setDeletingItem(item)} className="grid size-10 place-items-center rounded-lg text-muted hover:bg-red-50 hover:text-red-600"><Trash2 className="size-4" /></button></div>
                      </li>
                    ))}
                  <li className="min-h-24"><button type="button" aria-label="新增事项" onClick={() => openCreate(category)} className="inline-flex size-full min-h-24 items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-canvas/40 text-sm font-semibold text-brand hover:border-brand/35 hover:bg-brand-soft"><Plus className="size-4" /> {items.length ? '新增事项' : '新增第一项'}</button></li>
                </ul>
              </div>
            </details>
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
          void deletePreparationItem(deletingItem.id).then(() => setDeletingItem(undefined)).catch(() => undefined);
        }}
      />
    </section>
  );
}
