import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from './AuthProvider';
import { useAuth } from './useAuth';
import { createAuthService, createTestSession } from '../test/authTestUtils';

function AuthProbe() {
  const { user, isLoading, signOut } = useAuth();
  return (
    <div>
      <p>{isLoading ? 'loading' : (user?.email ?? 'signed-out')}</p>
      <button type="button" onClick={() => void signOut()}>
        退出
      </button>
    </div>
  );
}

describe('AuthProvider', () => {
  it('loads the current session and reacts to auth state changes', async () => {
    const service = createAuthService(createTestSession());
    render(
      <AuthProvider service={service}>
        <AuthProbe />
      </AuthProvider>,
    );

    expect(await screen.findByText('traveler@example.com')).toBeInTheDocument();

    act(() => service.emit(null));
    expect(screen.getByText('signed-out')).toBeInTheDocument();
  });

  it('delegates sign out to the centralized auth service', async () => {
    const user = userEvent.setup();
    const service = createAuthService(createTestSession());
    render(
      <AuthProvider service={service}>
        <AuthProbe />
      </AuthProvider>,
    );

    await screen.findByText('traveler@example.com');
    await user.click(screen.getByRole('button', { name: '退出' }));
    expect(service.signOut).toHaveBeenCalledOnce();
  });
});
