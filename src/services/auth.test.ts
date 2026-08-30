import { getAuthErrorMessage } from './auth';

describe('getAuthErrorMessage', () => {
  it.each([
    ['invalid_credentials', '邮箱或密码不正确。'],
    ['email_not_confirmed', '邮箱尚未验证，请先完成邮箱验证。'],
    ['user_already_exists', '该邮箱已经注册，请直接登录。'],
    ['over_email_send_rate_limit', '邮件发送过于频繁，请稍后再试。'],
    ['weak_password', '密码强度不足，请使用至少 8 个字符。'],
  ])('translates %s', (code, message) => {
    expect(getAuthErrorMessage({ code })).toBe(message);
  });

  it('does not expose unknown Supabase error messages', () => {
    expect(getAuthErrorMessage(new Error('Internal auth failure'))).toBe(
      '登录服务暂时不可用，请稍后重试。',
    );
  });

  it('provides a useful network error', () => {
    expect(getAuthErrorMessage(new Error('Failed to fetch'))).toBe(
      '无法连接登录服务，请检查网络后重试。',
    );
  });
});
