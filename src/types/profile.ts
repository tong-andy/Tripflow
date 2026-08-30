import type { Expense, Purchase } from './archive';
import type { Trip } from './trip';

export const mapProviders = [
  'system',
  'apple',
  'amap',
  'baidu',
  'google',
] as const;

export type MapProvider = (typeof mapProviders)[number];

export interface UserProfile {
  userId: string;
  nickname: string;
  homeLocation: string;
  defaultCurrency: string;
  defaultTimezone: string;
  defaultMapProvider: MapProvider;
  showExpenses: boolean;
  showPurchases: boolean;
  showJournals: boolean;
  showMediaNotes: boolean;
  recordPreferencesConfigured: boolean;
  createdAt: string;
  updatedAt: string;
}

export type UpdateUserProfileInput = Pick<
  UserProfile,
  | 'nickname'
  | 'homeLocation'
  | 'defaultCurrency'
  | 'defaultTimezone'
  | 'defaultMapProvider'
  | 'showExpenses'
  | 'showPurchases'
  | 'showJournals'
  | 'showMediaNotes'
>;

export interface AnnualTravelStats {
  year: number;
  totalTrips: number;
  completedTrips: number;
  totalDays: number;
  destinations: number;
  expensesByCurrency: Record<string, number>;
  longestTrip: Pick<Trip, 'id' | 'name'> & { days: number } | null;
}

export interface ProfileData {
  profile: UserProfile;
  annualExpenses: Expense[];
  annualPurchases: Purchase[];
}
