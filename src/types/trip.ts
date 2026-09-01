export type PreparationCategory =
  | 'transit'
  | 'accommodation'
  | 'documents'
  | 'activities'
  | 'connectivity'
  | 'essentials';

export type ItineraryStatus = 'planned' | 'completed' | 'skipped';

export interface TripDay {
  id: string;
  tripId: string;
  dayNumber: number;
  date: string;
}

export interface TripDestination {
  id: string;
  tripId: string;
  cityName: string;
  countryName: string;
  latitude: number;
  longitude: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export type TripDestinationInput = Pick<
  TripDestination,
  'cityName' | 'countryName' | 'latitude' | 'longitude'
>;

export interface PreparationItem {
  id: string;
  tripId: string;
  title: string;
  category: PreparationCategory;
  completed: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface ItineraryItem {
  id: string;
  tripId: string;
  tripDayId: string;
  time: string | null;
  placeName: string;
  address?: string;
  durationMinutes: number;
  notes: string;
  status: ItineraryStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Trip {
  id: string;
  name: string;
  destination: string;
  departureLocation: string;
  startDate: string;
  endDate: string;
  days: TripDay[];
  preparationItems: PreparationItem[];
  itineraryItems: ItineraryItem[];
  destinations: TripDestination[];
  budgetAmount: number | null;
  budgetCurrency: string | null;
  timezone: string;
  travelNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTripInput {
  name: string;
  destination: string;
  departureLocation: string;
  startDate: string;
  endDate: string;
  timezone?: string;
  destinations: TripDestinationInput[];
}

export type UpdateTripInput = Partial<
  Pick<Trip, 'name' | 'destination' | 'departureLocation' | 'budgetAmount' | 'budgetCurrency' | 'timezone' | 'travelNote'>
>;

export interface CreateTripDayInput {
  dayNumber: number;
  date: string;
}

export interface CreatePreparationItemInput {
  title: string;
  category: PreparationCategory;
  notes: string;
}

export interface CreateItineraryItemInput {
  tripDayId: string;
  time: string | null;
  placeName: string;
  address?: string;
  durationMinutes: number;
  notes: string;
  status: ItineraryStatus;
}

export type UpdateItineraryItemInput = Partial<
  Pick<
    ItineraryItem,
    | 'tripDayId'
    | 'time'
    | 'placeName'
    | 'address'
    | 'durationMinutes'
    | 'notes'
    | 'status'
  >
>;
