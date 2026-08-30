import type { Session, User } from '@supabase/supabase-js';
import { vi } from 'vitest';
import type { AuthService } from '../services/auth';

export function createTestUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-123',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: '2026-08-31T00:00:00.000Z',
    email: 'traveler@example.com',
    ...overrides,
  };
}

export function createTestSession(user = createTestUser()): Session {
  return {
    access_token: 'test-access-token',
    refresh_token: 'test-refresh-token',
    expires_in: 3600,
    token_type: 'bearer',
    user,
  };
}

export function createAuthService(
  session: Session | null = null,
): AuthService & {
  emit: (session: Session | null) => void;
} {
  let listener: (session: Session | null) => void = () => undefined;

  return {
    getSession: vi.fn().mockResolvedValue(session),
    onAuthStateChange: vi.fn((nextListener) => {
      listener = nextListener;
      return () => undefined;
    }),
    signInWithPassword: vi.fn().mockResolvedValue(createTestSession()),
    signUpWithPassword: vi.fn().mockResolvedValue(null),
    requestEmailOtp: vi.fn().mockResolvedValue(undefined),
    verifyEmailOtp: vi.fn().mockResolvedValue(undefined),
    signOut: vi.fn().mockResolvedValue(undefined),
    emit: (nextSession) => listener(nextSession),
  };
}
