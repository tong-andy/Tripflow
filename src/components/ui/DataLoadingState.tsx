import { Cloud } from 'lucide-react';

export function DataLoadingState() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="grid min-h-[45vh] place-items-center rounded-3xl border border-line bg-white/70 p-8 text-center"
    >
      <div>
        <Cloud className="mx-auto size-7 text-brand" />
        <p className="mt-3 text-sm font-semibold text-ink">正在读取云端旅行…</p>
        <p className="mt-1 text-xs text-muted">网络较慢时可能需要几秒钟。</p>
      </div>
    </div>
  );
}
