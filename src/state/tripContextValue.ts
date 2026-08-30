import { createContext } from 'react';
import type { TripState } from '../services/tripStorage';
import type {
  CreateItineraryItemInput,
  CreatePreparationItemInput,
  CreateTripInput,
  ItineraryStatus,
  PreparationItem,
  Trip,
  UpdateItineraryItemInput,
  UpdateTripInput,
} from '../types/trip';

export interface TripContextValue extends TripState {
  selectedTrip: Trip | undefined;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  selectTrip: (tripId: string) => void;
  retry: () => Promise<void>;
  clearError: () => void;
  addTrip: (input: CreateTripInput) => Promise<Trip>;
  updateTrip: (tripId: string, input: UpdateTripInput) => Promise<Trip>;
  deleteTrip: (tripId: string) => Promise<void>;
  addPreparationItem: (
    input: CreatePreparationItemInput,
  ) => Promise<PreparationItem>;
  updatePreparationItem: (
    itemId: string,
    updates: Pick<PreparationItem, 'title' | 'category'>,
  ) => Promise<PreparationItem>;
  togglePreparationItem: (itemId: string) => Promise<void>;
  deletePreparationItem: (itemId: string) => Promise<void>;
  addItineraryItem: (input: CreateItineraryItemInput) => Promise<void>;
  updateItineraryItem: (
    itemId: string,
    updates: UpdateItineraryItemInput,
  ) => Promise<void>;
  updateItineraryStatus: (
    itemId: string,
    status: ItineraryStatus,
  ) => Promise<void>;
  deleteItineraryItem: (itemId: string) => Promise<void>;
}

export const TripContext = createContext<TripContextValue | undefined>(
  undefined,
);
