import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <section className="grid min-h-[55vh] place-items-center text-center">
      <div>
        <p className="text-sm font-bold text-brand">404</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink">没有找到这个页面</h1>
        <p className="mt-2 text-sm text-muted">这段旅程可能还没有被创建。</p>
        <Link to="/trips" className="mt-6 inline-flex rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white">返回我的旅行</Link>
      </div>
    </section>
  );
}

