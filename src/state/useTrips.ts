import { useContext } from 'react';
import { TripContext, type TripContextValue } from './tripContextValue';

export function useTrips(): TripContextValue {
  const context = useContext(TripContext);
  if (!context) {
    throw new Error('useTrips must be used within TripProvider');
  }
  return context;
}

