import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  supabaseTripRepository,
  type TripRepository,
} from '../services/tripRepository';
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
import { useAuth } from './useAuth';
import { TripContext } from './tripContextValue';

interface TripProviderProps {
  children: ReactNode;
  repository?: TripRepository;
}

const emptyState: TripState = { trips: [], selectedTripId: '' };

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : '云端数据操作失败，请稍后重试。';
}

export function TripProvider({
  children,
  repository = supabaseTripRepository,
}: TripProviderProps) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [state, setState] = useState<TripState>(emptyState);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mutationInProgress = useRef(false);
  const loadRequestId = useRef(0);
  const activeUserId = useRef<string | undefined>(undefined);

  useEffect(() => {
    activeUserId.current = user?.id;
  }, [user?.id]);

  const loadTrips = useCallback(
    async (userId: string) => {
      const requestId = ++loadRequestId.current;
      setIsLoading(true);
      setError(null);
      try {
        const trips = await repository.listTrips(userId);
        if (
          requestId !== loadRequestId.current ||
          activeUserId.current !== userId
        ) {
          return;
        }
        setState((current) => ({
          trips,
          selectedTripId: trips.some(
            (trip) => trip.id === current.selectedTripId,
          )
            ? current.selectedTripId
            : (trips[0]?.id ?? ''),
        }));
      } catch (caughtError) {
        if (requestId === loadRequestId.current) {
          setError(getErrorMessage(caughtError));
        }
      } finally {
        if (requestId === loadRequestId.current) setIsLoading(false);
      }
    },
    [repository],
  );

  useEffect(() => {
    if (isAuthLoading) return;

    if (!user) {
      loadRequestId.current += 1;
      queueMicrotask(() => {
        setState(emptyState);
        setError(null);
        setIsLoading(false);
      });
      return;
    }

    let active = true;
    queueMicrotask(() => {
      if (active) void loadTrips(user.id);
    });
    return () => {
      active = false;
    };
  }, [isAuthLoading, loadTrips, user]);

  function requireUserId(): string {
    if (!user) throw new Error('登录状态已失效，请重新登录。');
    return user.id;
  }

  function assertActiveUser(userId: string): void {
    if (activeUserId.current !== userId) {
      throw new Error('登录账户已发生变化，请重新操作。');
    }
  }

  async function performMutation<T>(operation: () => Promise<T>): Promise<T> {
    if (mutationInProgress.current) {
      throw new Error('正在保存上一项操作，请稍候。');
    }
    mutationInProgress.current = true;
    setIsSaving(true);
    setError(null);
    try {
      return await operation();
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
      throw caughtError;
    } finally {
      mutationInProgress.current = false;
      setIsSaving(false);
    }
  }

  const selectedTrip = state.trips.find(
    (trip) => trip.id === state.selectedTripId,
  );

  function selectTrip(tripId: string) {
    setState((current) =>
      current.trips.some((trip) => trip.id === tripId)
        ? { ...current, selectedTripId: tripId }
        : current,
    );
  }

  async function addTrip(input: CreateTripInput): Promise<Trip> {
    const userId = requireUserId();
    return performMutation(async () => {
      const trip = await repository.createTrip(userId, input);
      assertActiveUser(userId);
      setState((current) => ({
        trips: [...current.trips.filter((item) => item.id !== trip.id), trip],
        selectedTripId: trip.id,
      }));
      return trip;
    });
  }

  async function updateTrip(
    tripId: string,
    input: UpdateTripInput,
  ): Promise<Trip> {
    const userId = requireUserId();
    return performMutation(async () => {
      const trip = await repository.updateTrip(userId, tripId, input);
      assertActiveUser(userId);
      setState((current) => ({
        ...current,
        trips: current.trips.map((item) =>
          item.id === trip.id ? trip : item,
        ),
      }));
      return trip;
    });
  }

  async function deleteTrip(tripId: string): Promise<void> {
    const userId = requireUserId();
    return performMutation(async () => {
      await repository.deleteTrip(userId, tripId);
      assertActiveUser(userId);
      setState((current) => {
        const trips = current.trips.filter((trip) => trip.id !== tripId);
        return {
          trips,
          selectedTripId:
            current.selectedTripId === tripId
              ? (trips[0]?.id ?? '')
              : current.selectedTripId,
        };
      });
    });
  }

  async function addPreparationItem(
    input: CreatePreparationItemInput,
  ): Promise<PreparationItem> {
    const tripId = state.selectedTripId;
    if (!tripId) throw new Error('请先创建一段旅行。');
    const userId = requireUserId();
    return performMutation(async () => {
      const item = await repository.createPreparationItem(
        userId,
        tripId,
        input,
      );
      assertActiveUser(userId);
      setState((current) => ({
        ...current,
        trips: current.trips.map((trip) =>
          trip.id === item.tripId
            ? {
                ...trip,
                preparationItems: [...trip.preparationItems, item],
                updatedAt: item.updatedAt,
              }
            : trip,
        ),
      }));
      return item;
    });
  }

  async function updatePreparationItem(
    itemId: string,
    updates: Pick<PreparationItem, 'title' | 'category'>,
  ): Promise<PreparationItem> {
    const userId = requireUserId();
    return performMutation(async () => {
      const item = await repository.updatePreparationItem(
        userId,
        itemId,
        updates,
      );
      assertActiveUser(userId);
      setState((current) => ({
        ...current,
        trips: current.trips.map((trip) =>
          trip.id === item.tripId
            ? {
                ...trip,
                preparationItems: trip.preparationItems.map((currentItem) =>
                  currentItem.id === item.id ? item : currentItem,
                ),
                updatedAt: item.updatedAt,
              }
            : trip,
        ),
      }));
      return item;
    });
  }

  async function togglePreparationItem(itemId: string): Promise<void> {
    const item = selectedTrip?.preparationItems.find(
      (candidate) => candidate.id === itemId,
    );
    if (!item) throw new Error('找不到准备事项。');
    const userId = requireUserId();
    await performMutation(async () => {
      const updated = await repository.updatePreparationItem(
        userId,
        itemId,
        { completed: !item.completed },
      );
      assertActiveUser(userId);
      setState((current) => ({
        ...current,
        trips: current.trips.map((trip) =>
          trip.id === updated.tripId
            ? {
                ...trip,
                preparationItems: trip.preparationItems.map((currentItem) =>
                  currentItem.id === updated.id ? updated : currentItem,
                ),
                updatedAt: updated.updatedAt,
              }
            : trip,
        ),
      }));
    });
  }

  async function deletePreparationItem(itemId: string): Promise<void> {
    const tripId = state.trips.find((trip) =>
      trip.preparationItems.some((item) => item.id === itemId),
    )?.id;
    const userId = requireUserId();
    return performMutation(async () => {
      await repository.deletePreparationItem(userId, itemId);
      assertActiveUser(userId);
      setState((current) => ({
        ...current,
        trips: current.trips.map((trip) =>
          trip.id === tripId
            ? {
                ...trip,
                preparationItems: trip.preparationItems.filter(
                  (item) => item.id !== itemId,
                ),
              }
            : trip,
        ),
      }));
    });
  }

  async function addItineraryItem(
    input: CreateItineraryItemInput,
  ): Promise<void> {
    const tripId = state.selectedTripId;
    if (!tripId) throw new Error('请先创建一段旅行。');
    const userId = requireUserId();
    return performMutation(async () => {
      const item = await repository.createItineraryItem(
        userId,
        tripId,
        input,
      );
      assertActiveUser(userId);
      setState((current) => ({
        ...current,
        trips: current.trips.map((trip) =>
          trip.id === item.tripId
            ? {
                ...trip,
                itineraryItems: [...trip.itineraryItems, item],
                updatedAt: item.updatedAt,
              }
            : trip,
        ),
      }));
    });
  }

  async function updateItineraryItem(
    itemId: string,
    updates: UpdateItineraryItemInput,
  ): Promise<void> {
    const userId = requireUserId();
    return performMutation(async () => {
      const item = await repository.updateItineraryItem(
        userId,
        itemId,
        updates,
      );
      assertActiveUser(userId);
      setState((current) => ({
        ...current,
        trips: current.trips.map((trip) =>
          trip.id === item.tripId
            ? {
                ...trip,
                itineraryItems: trip.itineraryItems.map((currentItem) =>
                  currentItem.id === item.id ? item : currentItem,
                ),
                updatedAt: item.updatedAt,
              }
            : trip,
        ),
      }));
    });
  }

  async function updateItineraryStatus(
    itemId: string,
    status: ItineraryStatus,
  ): Promise<void> {
    return updateItineraryItem(itemId, { status });
  }

  async function deleteItineraryItem(itemId: string): Promise<void> {
    const tripId = state.trips.find((trip) =>
      trip.itineraryItems.some((item) => item.id === itemId),
    )?.id;
    const userId = requireUserId();
    return performMutation(async () => {
      await repository.deleteItineraryItem(userId, itemId);
      assertActiveUser(userId);
      setState((current) => ({
        ...current,
        trips: current.trips.map((trip) =>
          trip.id === tripId
            ? {
                ...trip,
                itineraryItems: trip.itineraryItems.filter(
                  (item) => item.id !== itemId,
                ),
              }
            : trip,
        ),
      }));
    });
  }

  const value = {
    ...state,
    selectedTrip,
    isLoading,
    isSaving,
    error,
    selectTrip,
    retry: () => (user ? loadTrips(user.id) : Promise.resolve()),
    clearError: () => setError(null),
    addTrip,
    updateTrip,
    deleteTrip,
    addPreparationItem,
    updatePreparationItem,
    togglePreparationItem,
    deletePreparationItem,
    addItineraryItem,
    updateItineraryItem,
    updateItineraryStatus,
    deleteItineraryItem,
  };

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}
