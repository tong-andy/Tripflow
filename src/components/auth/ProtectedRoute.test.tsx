import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../../state/AuthProvider';
import { createAuthService, createTestSession } from '../../test/authTestUtils';
import { ProtectedRoute } from './ProtectedRoute';

function TestRoutes({ session = null }: { session?: ReturnType<typeof createTestSession> | null }) {
  const service = createAuthService(session);
  return (
    <AuthProvider service={service}>
      <MemoryRouter initialEntries={['/itinerary']}>
        <Routes>
          <Route path="/login" element={<h1>登录 TripFlow</h1>} />
          <Route
            path="/itinerary"
            element={
              <ProtectedRoute>
                <h1>每日行程</h1>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
}

describe('ProtectedRoute', () => {
  it('redirects signed-out visitors to login', async () => {
    render(<TestRoutes />);
    expect(
      await screen.findByRole('heading', { name: '登录 TripFlow' }),
    ).toBeInTheDocument();
  });

  it('renders protected content for an authenticated user', async () => {
    render(<TestRoutes session={createTestSession()} />);
    expect(
      await screen.findByRole('heading', { name: '每日行程' }),
    ).toBeInTheDocument();
  });
});
