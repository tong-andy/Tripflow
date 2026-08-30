import { Luggage, Plus } from 'lucide-react';

export function NoTripState({ onCreate }: { onCreate?: () => void }) {
  return (
    <div className="rounded-3xl border border-dashed border-line bg-white/70 px-6 py-14 text-center">
      <Luggage className="mx-auto size-8 text-brand" />
      <h2 className="mt-4 text-lg font-bold text-ink">还没有云端旅行</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">
        创建第一段旅行后，旅行日期、准备事项和每日行程会保存在你的账户中。
      </p>
      {onCreate ? (
        <button
          type="button"
          onClick={onCreate}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white"
        >
          <Plus className="size-4" /> 新建旅行
        </button>
      ) : null}
    </div>
  );
}
