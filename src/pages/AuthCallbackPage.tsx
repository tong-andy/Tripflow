import { Navigate } from 'react-router-dom';
import { AuthLoadingScreen } from '../components/auth/AuthLoadingScreen';
import { useAuth } from '../state/useAuth';

export function AuthCallbackPage() {
  const { user, isLoading, initializationError } = useAuth();

  if (isLoading) return <AuthLoadingScreen />;
  if (user) return <Navigate to="/trips" replace />;

  return (
    <main className="grid min-h-screen place-items-center bg-canvas px-5">
      <section className="w-full max-w-md rounded-3xl border border-line bg-white p-8 text-center shadow-card">
        <h1 className="text-xl font-bold text-ink">登录链接无效或已过期</h1>
        <p role={initializationError ? 'alert' : undefined} className="mt-3 text-sm leading-6 text-muted">
          {initializationError ?? '请返回登录页重新发送登录邮件。'}
        </p>
        <a
          href="/login"
          className="mt-6 inline-flex rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-white"
        >
          返回登录
        </a>
      </section>
    </main>
  );
}
