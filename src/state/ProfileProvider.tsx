import { useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  supabaseProfileRepository,
  type ProfileRepository,
} from '../services/profileRepository';
import type { Expense, Purchase } from '../types/archive';
import type { UpdateUserProfileInput, UserProfile } from '../types/profile';
import { useAuth } from './useAuth';
import { ProfileContext } from './profileContextValue';

export function ProfileProvider({
  children,
  repository = supabaseProfileRepository,
}: {
  children: ReactNode;
  repository?: ProfileRepository;
}) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setExpenses([]);
      setPurchases([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await repository.loadProfile(user.id);
      setProfile(data.profile);
      setExpenses(data.expenses);
      setPurchases(data.purchases);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '用户设置加载失败。');
    } finally {
      setIsLoading(false);
    }
  }, [repository, user]);

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

  async function saveProfile(input: UpdateUserProfileInput) {
    if (!user) throw new Error('登录状态已失效，请重新登录。');
    setIsSaving(true);
    setError(null);
    try {
      setProfile(await repository.saveProfile(user.id, input));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '用户设置保存失败。');
      throw caught;
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ProfileContext.Provider
      value={{
        profile,
        expenses,
        purchases,
        isLoading,
        isSaving,
        error,
        saveProfile,
        retry: load,
        clearError: () => setError(null),
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}
