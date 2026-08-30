import { createContext } from 'react';
import type {
  AnnualTravelStats,
  UpdateUserProfileInput,
  UserProfile,
} from '../types/profile';

export interface ProfileContextValue {
  profile: UserProfile | null;
  annualStats: AnnualTravelStats;
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
