import { Compass } from 'lucide-react';

export function AuthLoadingScreen() {
  return (
    <main className="grid min-h-screen place-items-center bg-canvas px-5 text-ink">
      <div className="text-center" role="status" aria-live="polite">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-brand text-white">
          <Compass className="size-6" />
        </span>
        <p className="mt-4 text-sm font-semibold">正在确认登录状态…</p>
      </div>
    </main>
  );
}
