import { Compass, LockKeyhole, Mail } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthLoadingScreen } from '../components/auth/AuthLoadingScreen';
import { useAuth } from '../state/useAuth';

type AuthMode = 'login' | 'register';

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : '操作失败，请稍后重试。';
}

export function LoginPage() {
  const {
    user,
    isLoading,
    initializationError,
    signInWithPassword,
    signUpWithPassword,
    requestEmailOtp,
    verifyEmailOtp,
  } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [registrationNotice, setRegistrationNotice] = useState<string | null>(
    null,
  );

  if (isLoading) return <AuthLoadingScreen />;
  if (user) return <Navigate to="/trips" replace />;

  function selectMode(nextMode: AuthMode) {
    setMode(nextMode);
    setPassword('');
    setConfirmPassword('');
    setFormError(null);
    setRegistrationNotice(null);
  }

  async function handleCredentialSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setRegistrationNotice(null);

    if (password.length < 8) {
      setFormError('密码至少需要 8 个字符。');
      return;
    }

    if (mode === 'register' && password !== confirmPassword) {
      setFormError('两次输入的密码不一致。');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        await signInWithPassword(email, password);
      } else {
        const { requiresEmailConfirmation } = await signUpWithPassword(
          email,
          password,
        );
        if (requiresEmailConfirmation) {
          setRegistrationNotice(
            '注册成功。请前往邮箱完成验证，然后返回 TripFlow 登录。',
          );
        }
      }
    } catch (error) {
      setFormError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    try {
      await requestEmailOtp(email);
      setEmailSent(true);
    } catch (error) {
      setFormError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleOtpSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    try {
      await verifyEmailOtp(email, otp);
    } catch (error) {
      setFormError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  const visibleError = formError ?? initializationError;

  return (
    <main className="grid min-h-screen bg-canvas px-5 py-10 text-ink sm:place-items-center">
      <section className="mx-auto w-full max-w-md rounded-3xl border border-line bg-white p-6 shadow-card sm:p-9">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-brand text-white">
            <Compass className="size-5" />
          </span>
          <div>
            <p className="text-lg font-bold tracking-tight">TripFlow</p>
            <p className="text-xs text-muted">让旅程清晰发生</p>
          </div>
        </div>

        <div className="mt-9">
          <h1 className="text-2xl font-bold tracking-tight">
            {mode === 'login' ? '登录 TripFlow' : '创建 TripFlow 账户'}
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            {mode === 'login'
              ? '使用邮箱和密码进入你的旅行工作台。'
              : '创建账户后，你可以在自己的账户中管理旅行。'}
          </p>
        </div>

        <div
          aria-label="身份模式"
          className="mt-6 grid grid-cols-2 rounded-xl bg-canvas p-1"
        >
          <button
            type="button"
            aria-pressed={mode === 'login'}
            onClick={() => selectMode('login')}
            className={`rounded-lg px-3 py-2 text-sm font-semibold ${
              mode === 'login'
                ? 'bg-white text-ink shadow-sm'
                : 'text-muted hover:text-ink'
            }`}
          >
            登录
          </button>
          <button
            type="button"
            aria-pressed={mode === 'register'}
            onClick={() => selectMode('register')}
            className={`rounded-lg px-3 py-2 text-sm font-semibold ${
              mode === 'register'
                ? 'bg-white text-ink shadow-sm'
                : 'text-muted hover:text-ink'
            }`}
          >
            注册
          </button>
        </div>

        <form onSubmit={handleCredentialSubmit} className="mt-6" noValidate>
          <label htmlFor="auth-email" className="field-label">
            邮箱地址
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input
              id="auth-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="field-input pl-10"
              placeholder="you@example.com"
            />
          </div>

          <label htmlFor="auth-password" className="field-label mt-4">
            密码
          </label>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input
              id="auth-password"
              name="password"
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="field-input pl-10"
            />
          </div>
          <p className="mt-1.5 text-xs text-muted">至少 8 个字符</p>

          {mode === 'register' ? (
            <>
              <label htmlFor="auth-confirm-password" className="field-label mt-4">
                确认密码
              </label>
              <input
                id="auth-confirm-password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="field-input"
              />
            </>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-5 w-full rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting
              ? mode === 'login'
                ? '正在登录…'
                : '正在注册…'
              : mode === 'login'
                ? '登录 TripFlow'
                : '创建账户'}
          </button>
        </form>

        {visibleError ? (
          <p role="alert" className="mt-4 text-sm text-red-700">
            {visibleError}
          </p>
        ) : null}

        {registrationNotice ? (
          <p
            role="status"
            className="mt-4 rounded-xl border border-brand/20 bg-brand-soft p-3 text-sm leading-6 text-brand"
          >
            {registrationNotice}
          </p>
        ) : null}

        <details className="mt-7 border-t border-line pt-5">
          <summary className="cursor-pointer text-center text-xs font-semibold text-muted hover:text-ink">
            使用 Magic Link / 邮箱验证码
          </summary>
          <div className="mt-4 rounded-2xl bg-canvas p-4">
            <p className="text-xs leading-5 text-muted">
              邮件免密登录目前受发送频率限制，建议开发期间优先使用密码登录。
            </p>
            <form onSubmit={handleEmailSubmit} className="mt-4">
              <label htmlFor="magic-email" className="field-label">
                Magic Link 邮箱
              </label>
              <input
                id="magic-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="field-input"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-3 w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink disabled:opacity-60"
              >
                发送登录邮件
              </button>
            </form>

            {emailSent ? (
              <div className="mt-4 rounded-xl border border-brand/20 bg-brand-soft p-3">
                <p className="text-sm font-semibold text-brand">登录邮件已发送</p>
                <p className="mt-1 text-xs leading-5 text-muted">
                  可点击邮件中的链接，或输入邮件里的验证码。
                </p>
                <form onSubmit={handleOtpSubmit} className="mt-3">
                  <label htmlFor="login-otp" className="field-label">
                    邮箱验证码
                  </label>
                  <input
                    id="login-otp"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    required
                    minLength={6}
                    value={otp}
                    onChange={(event) => setOtp(event.target.value)}
                    className="field-input tracking-[0.25em]"
                    placeholder="000000"
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="mt-3 w-full rounded-xl border border-brand/30 bg-white px-4 py-2.5 text-sm font-semibold text-brand disabled:opacity-60"
                  >
                    验证并登录
                  </button>
                </form>
              </div>
            ) : null}
          </div>
        </details>

        <p className="mt-7 text-xs leading-5 text-muted">
          登录即表示你同意仅在自己的账户中管理旅行数据。请勿在浏览器中配置
          service role key 或数据库密码。
        </p>
      </section>
    </main>
  );
}
