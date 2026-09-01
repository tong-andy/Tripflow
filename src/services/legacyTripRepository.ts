import { createId, createTrip } from '../domain/trips';
import type {
  CreateItineraryItemInput,
  CreatePreparationItemInput,
  CreateTripDayInput,
  CreateTripInput,
  PreparationItem,
  Trip,
  UpdateItineraryItemInput,
  UpdateTripInput,
} from '../types/trip';
import { loadTripState, saveTripState } from './tripStorage';
import type { TripRepository } from './tripRepository';

/**
 * Phase 02A compatibility adapter. It is opt-in only; production defaults to
 * the Supabase repository and does not automatically mix local and cloud data.
 */
export function createLegacyTripRepository(
  storage: Storage | undefined,
): TripRepository {
  function readTrips(): Trip[] {
    return loadTripState(storage).trips;
  }

  function writeTrips(trips: Trip[]): void {
    const previous = loadTripState(storage);
    const selectedTripId = trips.some(
      (trip) => trip.id === previous.selectedTripId,
    )
      ? previous.selectedTripId
      : (trips[0]?.id ?? '');
    saveTripState(storage, { trips, selectedTripId });
  }

  function replaceTrip(tripId: string, update: (trip: Trip) => Trip): Trip {
    let updated: Trip | undefined;
    const trips = readTrips().map((trip) => {
      if (trip.id !== tripId) return trip;
      updated = update(trip);
      return updated;
    });
    if (!updated) throw new Error('找不到本地旅行。');
    writeTrips(trips);
    return updated;
  }

  return {
    async listTrips() {
      return readTrips();
    },

    async createTrip(_userId, input: CreateTripInput) {
      const trip = createTrip(input);
      writeTrips([...readTrips(), trip]);
      return trip;
    },

    async updateTrip(_userId, tripId, input: UpdateTripInput) {
      return replaceTrip(tripId, (trip) => ({
        ...trip,
        ...input,
        updatedAt: new Date().toISOString(),
      }));
    },

    async replaceTripDestinations(_userId, tripId, destinations) {
      const timestamp = new Date().toISOString();
      return replaceTrip(tripId, (trip) => ({
        ...trip,
        destinations: destinations.map((destination, index) => ({
          id: createId('destination'),
          tripId,
          ...destination,
          sortOrder: index,
          createdAt: timestamp,
          updatedAt: timestamp,
        })),
        destination:
          destinations.map((destination) => destination.cityName).join(' · ') ||
          trip.destination,
        updatedAt: timestamp,
      }));
    },

    async deleteTrip(_userId, tripId) {
      writeTrips(readTrips().filter((trip) => trip.id !== tripId));
    },

    async listTripDays(_userId, tripId) {
      return readTrips().find((trip) => trip.id === tripId)?.days ?? [];
    },

    async createTripDays(_userId, tripId, inputs: CreateTripDayInput[]) {
      const days = inputs.map((input) => ({
        id: createId('day'),
        tripId,
        ...input,
      }));
      replaceTrip(tripId, (trip) => ({
        ...trip,
        days: [...trip.days, ...days],
        updatedAt: new Date().toISOString(),
      }));
      return days;
    },

    async createPreparationItem(
      _userId,
      tripId,
      input: CreatePreparationItemInput,
    ) {
      const timestamp = new Date().toISOString();
      const item: PreparationItem = {
        id: createId('prep'),
        tripId,
        title: input.title.trim(),
        category: input.category,
        completed: false,
        notes: input.notes.trim(),
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      replaceTrip(tripId, (trip) => ({
        ...trip,
        preparationItems: [...trip.preparationItems, item],
        updatedAt: timestamp,
      }));
      return item;
    },

    async updatePreparationItem(_userId, itemId, updates) {
      const trip = readTrips().find((candidate) =>
        candidate.preparationItems.some((item) => item.id === itemId),
      );
      if (!trip) throw new Error('找不到本地准备事项。');
      const timestamp = new Date().toISOString();
      let updatedItem: PreparationItem | undefined;
      replaceTrip(trip.id, (current) => ({
        ...current,
        preparationItems: current.preparationItems.map((item) => {
          if (item.id !== itemId) return item;
          updatedItem = { ...item, ...updates, updatedAt: timestamp };
          return updatedItem;
        }),
        updatedAt: timestamp,
      }));
      if (!updatedItem) throw new Error('找不到本地准备事项。');
      return updatedItem;
    },

    async deletePreparationItem(_userId, itemId) {
      const trip = readTrips().find((candidate) =>
        candidate.preparationItems.some((item) => item.id === itemId),
      );
      if (!trip) return;
      replaceTrip(trip.id, (current) => ({
        ...current,
        preparationItems: current.preparationItems.filter(
          (item) => item.id !== itemId,
        ),
        updatedAt: new Date().toISOString(),
      }));
    },

    async createItineraryItem(
      _userId,
      tripId,
      input: CreateItineraryItemInput,
    ) {
      const timestamp = new Date().toISOString();
      const item = {
        id: createId('itinerary'),
        tripId,
        ...input,
        placeName: input.placeName.trim(),
        notes: input.notes.trim(),
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      replaceTrip(tripId, (trip) => ({
        ...trip,
        itineraryItems: [...trip.itineraryItems, item],
        updatedAt: timestamp,
      }));
      return item;
    },

    async updateItineraryItem(
      _userId,
      itemId,
      updates: UpdateItineraryItemInput,
    ) {
      const trip = readTrips().find((candidate) =>
        candidate.itineraryItems.some((item) => item.id === itemId),
      );
      if (!trip) throw new Error('找不到本地行程安排。');
      const timestamp = new Date().toISOString();
      let updatedItem = trip.itineraryItems.find((item) => item.id === itemId);
      replaceTrip(trip.id, (current) => ({
        ...current,
        itineraryItems: current.itineraryItems.map((item) => {
          if (item.id !== itemId) return item;
          updatedItem = { ...item, ...updates, updatedAt: timestamp };
          return updatedItem;
        }),
        updatedAt: timestamp,
      }));
      if (!updatedItem) throw new Error('找不到本地行程安排。');
      return updatedItem;
    },

    async deleteItineraryItem(_userId, itemId) {
      const trip = readTrips().find((candidate) =>
        candidate.itineraryItems.some((item) => item.id === itemId),
      );
      if (!trip) return;
      replaceTrip(trip.id, (current) => ({
        ...current,
        itineraryItems: current.itineraryItems.filter(
          (item) => item.id !== itemId,
        ),
        updatedAt: new Date().toISOString(),
      }));
    },
  };
}
