import { Navigate } from 'react-router-dom';
import { getTripStatus } from '../../domain/travelMode';
import { TodayPage } from '../../pages/TodayPage';
import { useTrips } from '../../state/useTrips';

export function TodayRoute() {
  const { selectedTrip } = useTrips();
  if (selectedTrip && getTripStatus(selectedTrip) !== 'active') {
    return <Navigate to="/overview" replace />;
  }
  return <TodayPage />;
}
