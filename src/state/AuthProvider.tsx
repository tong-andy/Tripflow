import type { Session } from '@supabase/supabase-js';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  supabaseAuthService,
  type AuthService,
} from '../services/auth';
import { AuthContext } from './authContextValue';

interface AuthProviderProps {
  children: ReactNode;
  service?: AuthService;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : '身份服务暂时不可用。';
}

export function AuthProvider({
  children,
  service = supabaseAuthService,
}: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initializationError, setInitializationError] = useState<string | null>(
    null,
  );

  useEffect(() => {
    let active = true;
    let unsubscribe: () => void = () => undefined;

    try {
      unsubscribe = service.onAuthStateChange((nextSession) => {
        if (!active) return;
        setSession(nextSession);
        setInitializationError(null);
        setIsLoading(false);
      });
    } catch (error) {
      queueMicrotask(() => {
        if (!active) return;
        setInitializationError(getErrorMessage(error));
        setIsLoading(false);
      });
    }

    void service
      .getSession()
      .then((currentSession) => {
        if (!active) return;
        setSession(currentSession);
        setInitializationError(null);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setInitializationError(getErrorMessage(error));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [service]);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      isLoading,
      initializationError,
      signInWithPassword: async (email: string, password: string) => {
        const nextSession = await service.signInWithPassword(
          email.trim(),
          password,
        );
        setSession(nextSession);
      },
      signUpWithPassword: async (email: string, password: string) => {
        const nextSession = await service.signUpWithPassword(
          email.trim(),
          password,
        );
        if (nextSession) setSession(nextSession);
        return { requiresEmailConfirmation: nextSession === null };
      },
      requestEmailOtp: (email: string) =>
        service.requestEmailOtp(
          email.trim(),
          `${window.location.origin}/auth/callback`,
        ),
      verifyEmailOtp: (email: string, token: string) =>
        service.verifyEmailOtp(email.trim(), token.trim()),
      signOut: () => service.signOut(),
    }),
    [initializationError, isLoading, service, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
