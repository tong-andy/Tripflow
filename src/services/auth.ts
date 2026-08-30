import type { AuthError, Session } from '@supabase/supabase-js';
import { getSupabaseClient } from './supabase';

export interface AuthService {
  getSession: () => Promise<Session | null>;
  onAuthStateChange: (listener: (session: Session | null) => void) => () => void;
  signInWithPassword: (email: string, password: string) => Promise<Session>;
  signUpWithPassword: (
    email: string,
    password: string,
  ) => Promise<Session | null>;
  requestEmailOtp: (email: string, redirectTo: string) => Promise<void>;
  verifyEmailOtp: (email: string, token: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const authErrorMessages: Record<string, string> = {
  anonymous_provider_disabled: '当前项目未启用匿名登录。',
  captcha_failed: '安全验证失败，请刷新页面后重试。',
  email_address_invalid: '请输入有效的邮箱地址。',
  email_exists: '该邮箱已经注册，请直接登录。',
  email_not_confirmed: '邮箱尚未验证，请先完成邮箱验证。',
  email_provider_disabled: '当前项目未启用邮箱登录。',
  flow_state_expired: '登录链接已经过期，请重新发起登录。',
  invalid_credentials: '邮箱或密码不正确。',
  over_email_send_rate_limit: '邮件发送过于频繁，请稍后再试。',
  over_request_rate_limit: '操作过于频繁，请稍后再试。',
  signup_disabled: '当前项目暂未开放注册。',
  user_already_exists: '该邮箱已经注册，请直接登录。',
  user_banned: '该账户暂时无法登录，请联系管理员。',
  validation_failed: '提交的信息格式不正确，请检查后重试。',
  weak_password: '密码强度不足，请使用至少 8 个字符。',
};

export function getAuthErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = error.code;
    if (typeof code === 'string' && authErrorMessages[code]) {
      return authErrorMessages[code];
    }
  }

  if (error instanceof Error && /failed to fetch/i.test(error.message)) {
    return '无法连接登录服务，请检查网络后重试。';
  }

  return '登录服务暂时不可用，请稍后重试。';
}

function throwAuthError(error: AuthError | null): void {
  if (error) throw new Error(getAuthErrorMessage(error));
}

export const supabaseAuthService: AuthService = {
  async getSession() {
    const { data, error } = await getSupabaseClient().auth.getSession();
    throwAuthError(error);
    return data.session;
  },

  onAuthStateChange(listener) {
    const { data } = getSupabaseClient().auth.onAuthStateChange(
      (_event, session) => listener(session),
    );
    return () => data.subscription.unsubscribe();
  },

  async signInWithPassword(email, password) {
    const { data, error } = await getSupabaseClient().auth.signInWithPassword({
      email,
      password,
    });
    throwAuthError(error);
    if (!data.session) {
      throw new Error('登录未能建立有效会话，请重试。');
    }
    return data.session;
  },

  async signUpWithPassword(email, password) {
    const { data, error } = await getSupabaseClient().auth.signUp({
      email,
      password,
    });
    throwAuthError(error);
    return data.session;
  },

  async requestEmailOtp(email, redirectTo) {
    const { error } = await getSupabaseClient().auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
        shouldCreateUser: true,
      },
    });
    throwAuthError(error);
  },

  async verifyEmailOtp(email, token) {
    const { error } = await getSupabaseClient().auth.verifyOtp({
      email,
      token,
      type: 'email',
    });
    throwAuthError(error);
  },

  async signOut() {
    const { error } = await getSupabaseClient().auth.signOut();
    throwAuthError(error);
  },
};
