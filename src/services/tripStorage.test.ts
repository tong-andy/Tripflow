import { describe, expect, it } from 'vitest';
import { seedTrip } from '../data/seed';
import {
  loadTripState,
  saveTripState,
  TRIP_STORAGE_KEY,
} from './tripStorage';

describe('trip storage', () => {
  it('saves and restores trip state', () => {
    const storage = window.localStorage;
    storage.clear();
    const state = {
      trips: [structuredClone(seedTrip)],
      selectedTripId: seedTrip.id,
    };

    saveTripState(storage, state);

    expect(loadTripState(storage)).toEqual(state);
  });

  it('falls back to seed data when stored data is invalid', () => {
    const storage = window.localStorage;
    storage.setItem(TRIP_STORAGE_KEY, '{invalid json');

    const state = loadTripState(storage);

    expect(state.trips).toHaveLength(1);
    expect(state.selectedTripId).toBe(seedTrip.id);
  });
});

