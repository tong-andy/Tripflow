import { Navigate, createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { AppShell } from '../layouts/AppShell';
import { ArchivePage } from '../pages/ArchivePage';
import { AuthCallbackPage } from '../pages/AuthCallbackPage';
import { ItineraryPage } from '../pages/ItineraryPage';
import { LoginPage } from '../pages/LoginPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { OverviewPage } from '../pages/OverviewPage';
import { PreparationPage } from '../pages/PreparationPage';
import { TripsPage } from '../pages/TripsPage';
import { TodayPage } from '../pages/TodayPage';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/auth/callback', element: <AuthCallbackPage /> },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/trips" replace /> },
      { path: 'trips', element: <TripsPage /> },
      { path: 'today', element: <TodayPage /> },
      { path: 'overview', element: <OverviewPage /> },
      { path: 'preparation', element: <PreparationPage /> },
      { path: 'itinerary', element: <ItineraryPage /> },
      { path: 'archive', element: <ArchivePage /> },
      { path: 'trips/:tripId/archive', element: <ArchivePage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
