import { createContext } from 'react';
import type {
  UpdateUserProfileInput,
  UserProfile,
} from '../types/profile';
import type { Expense, Purchase } from '../types/archive';

export interface ProfileContextValue {
  profile: UserProfile | null;
  expenses: Expense[];
  purchases: Purchase[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  saveProfile(input: UpdateUserProfileInput): Promise<void>;
  retry(): Promise<void>;
  clearError(): void;
}

export const ProfileContext = createContext<ProfileContextValue | undefined>(
  undefined,
);
