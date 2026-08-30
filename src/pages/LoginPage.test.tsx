import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { AuthService } from '../services/auth';
import { AuthProvider } from '../state/AuthProvider';
import {
  createAuthService,
  createTestSession,
} from '../test/authTestUtils';
import { LoginPage } from './LoginPage';

function renderLogin(service: AuthService) {
  return render(
    <AuthProvider service={service}>
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/trips" element={<h1>我的旅行</h1>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

async function fillRegistration(
  user: ReturnType<typeof userEvent.setup>,
  password: string,
  confirmation: string,
) {
  await user.click(screen.getByRole('button', { name: '注册' }));
  await user.type(screen.getByLabelText('邮箱地址'), 'new@example.com');
  await user.type(screen.getByLabelText('密码', { exact: true }), password);
  await user.type(screen.getByLabelText('确认密码'), confirmation);
}

describe('LoginPage', () => {
  it('logs in with email and password and enters trips', async () => {
    const user = userEvent.setup();
    const service = createAuthService();
    renderLogin(service);

    await screen.findByRole('heading', { name: '登录 TripFlow' });
    await user.type(screen.getByLabelText('邮箱地址'), 'user@example.com');
    await user.type(screen.getByLabelText('密码'), 'password123');
    await user.click(screen.getByRole('button', { name: '登录 TripFlow' }));

    expect(service.signInWithPassword).toHaveBeenCalledWith(
      'user@example.com',
      'password123',
    );
    expect(
      await screen.findByRole('heading', { name: '我的旅行' }),
    ).toBeInTheDocument();
  });

  it('does not submit registration when passwords do not match', async () => {
    const user = userEvent.setup();
    const service = createAuthService();
    renderLogin(service);

    await screen.findByRole('heading', { name: '登录 TripFlow' });
    await fillRegistration(user, 'password123', 'different123');
    await user.click(screen.getByRole('button', { name: '创建账户' }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      '两次输入的密码不一致。',
    );
    expect(service.signUpWithPassword).not.toHaveBeenCalled();
  });

  it('requires at least eight password characters before submitting', async () => {
    const user = userEvent.setup();
    const service = createAuthService();
    renderLogin(service);

    await screen.findByRole('heading', { name: '登录 TripFlow' });
    await user.type(screen.getByLabelText('邮箱地址'), 'user@example.com');
    await user.type(screen.getByLabelText('密码'), 'short');
    await user.click(screen.getByRole('button', { name: '登录 TripFlow' }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      '密码至少需要 8 个字符。',
    );
    expect(service.signInWithPassword).not.toHaveBeenCalled();
  });

  it('prompts for email confirmation when registration returns no session', async () => {
    const user = userEvent.setup();
    const service = createAuthService();
    renderLogin(service);

    await screen.findByRole('heading', { name: '登录 TripFlow' });
    await fillRegistration(user, 'password123', 'password123');
    await user.click(screen.getByRole('button', { name: '创建账户' }));

    expect(service.signUpWithPassword).toHaveBeenCalledWith(
      'new@example.com',
      'password123',
    );
    expect(screen.getByRole('status')).toHaveTextContent(
      '请前往邮箱完成验证',
    );
    expect(
      screen.getByRole('heading', { name: '创建 TripFlow 账户' }),
    ).toBeInTheDocument();
  });

  it('enters trips when registration returns a session', async () => {
    const user = userEvent.setup();
    const service = createAuthService();
    vi.mocked(service.signUpWithPassword).mockResolvedValue(createTestSession());
    renderLogin(service);

    await screen.findByRole('heading', { name: '登录 TripFlow' });
    await fillRegistration(user, 'password123', 'password123');
    await user.click(screen.getByRole('button', { name: '创建账户' }));

    expect(
      await screen.findByRole('heading', { name: '我的旅行' }),
    ).toBeInTheDocument();
  });

  it('shows a translated authentication error', async () => {
    const user = userEvent.setup();
    const service = createAuthService();
    vi.mocked(service.signInWithPassword).mockRejectedValue(
      new Error('邮箱或密码不正确。'),
    );
    renderLogin(service);

    await screen.findByRole('heading', { name: '登录 TripFlow' });
    await user.type(screen.getByLabelText('邮箱地址'), 'user@example.com');
    await user.type(screen.getByLabelText('密码'), 'wrongpass');
    await user.click(screen.getByRole('button', { name: '登录 TripFlow' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      '邮箱或密码不正确。',
    );
  });

  it('keeps Magic Link and email OTP available as a secondary method', async () => {
    const user = userEvent.setup();
    const service = createAuthService();
    renderLogin(service);

    await screen.findByRole('heading', { name: '登录 TripFlow' });
    await user.click(
      screen.getByText('使用 Magic Link / 邮箱验证码', { selector: 'summary' }),
    );
    await user.type(screen.getByLabelText('Magic Link 邮箱'), 'user@example.com');
    await user.click(screen.getByRole('button', { name: '发送登录邮件' }));

    expect(service.requestEmailOtp).toHaveBeenCalledWith(
      'user@example.com',
      expect.stringMatching(/\/auth\/callback$/),
    );
    expect(screen.getByText('登录邮件已发送')).toBeInTheDocument();

    await user.type(screen.getByLabelText('邮箱验证码'), '123456');
    await user.click(screen.getByRole('button', { name: '验证并登录' }));
    expect(service.verifyEmailOtp).toHaveBeenCalledWith(
      'user@example.com',
      '123456',
    );
  });
});
