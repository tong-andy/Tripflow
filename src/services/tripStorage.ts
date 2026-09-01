import { seedTrip } from '../data/seed';
import { normalizePreparationCategory } from '../domain/preparation';
import type { Trip } from '../types/trip';

export const TRIP_STORAGE_KEY = 'tripflow:phase-02a:v1';

export interface TripState {
  trips: Trip[];
  selectedTripId: string;
}

interface StoredTripState extends TripState {
  version: 1;
}

function createInitialState(): TripState {
  return {
    trips: [structuredClone(seedTrip)],
    selectedTripId: seedTrip.id,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isStoredTripState(value: unknown): value is StoredTripState {
  if (!isRecord(value)) {
    return false;
  }

  return (
    value.version === 1 &&
    typeof value.selectedTripId === 'string' &&
    Array.isArray(value.trips) &&
    value.trips.every(
      (trip) =>
        isRecord(trip) &&
        typeof trip.id === 'string' &&
        typeof trip.name === 'string' &&
        Array.isArray(trip.days) &&
        Array.isArray(trip.preparationItems) &&
        Array.isArray(trip.itineraryItems),
    )
  );
}

export function loadTripState(storage: Storage | undefined): TripState {
  if (!storage) {
    return createInitialState();
  }

  try {
    const rawValue = storage.getItem(TRIP_STORAGE_KEY);
    if (!rawValue) {
      return createInitialState();
    }

    const parsed: unknown = JSON.parse(rawValue);
    if (!isStoredTripState(parsed)) {
      return createInitialState();
    }

    const selectedTripExists = parsed.trips.some(
      (trip) => trip.id === parsed.selectedTripId,
    );

    return {
      trips: parsed.trips.map((trip) => ({
        ...trip,
        travelNote: trip.travelNote ?? null,
        destinations: trip.destinations ?? [],
        preparationItems: trip.preparationItems.map((item) => ({
          ...item,
          category: normalizePreparationCategory(item.category) ?? 'essentials',
          notes: item.notes ?? '',
        })),
      })),
      selectedTripId: selectedTripExists
        ? parsed.selectedTripId
        : (parsed.trips[0]?.id ?? ''),
    };
  } catch {
    return createInitialState();
  }
}

export function saveTripState(
  storage: Storage | undefined,
  state: TripState,
): void {
  if (!storage) {
    return;
  }

  try {
    const value: StoredTripState = { version: 1, ...state };
    storage.setItem(TRIP_STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Storage can be unavailable in private mode or when quota is exhausted.
  }
}
