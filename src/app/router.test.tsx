import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AppShell } from '../layouts/AppShell';
import { ArchivePage } from '../pages/ArchivePage';
import { ItineraryPage } from '../pages/ItineraryPage';
import { OverviewPage } from '../pages/OverviewPage';
import { PreparationPage } from '../pages/PreparationPage';
import { TripsPage } from '../pages/TripsPage';
import { TripProvider } from '../state/TripProvider';
import { AuthProvider } from '../state/AuthProvider';
import { createAuthService, createTestSession } from '../test/authTestUtils';
import { createLegacyTripRepository } from '../services/legacyTripRepository';
import { ProfileProvider } from '../state/ProfileProvider';
import { defaultUserProfile } from '../services/profileRepository';
import type { ProfileRepository } from '../services/profileRepository';

const authService = createAuthService(createTestSession());
const tripRepository = createLegacyTripRepository(window.localStorage);
const profileRepository: ProfileRepository = {
  loadProfile: async (userId) => ({ profile: defaultUserProfile(userId), annualExpenses: [], annualPurchases: [] }),
  saveProfile: async (userId, input) => ({ ...defaultUserProfile(userId), ...input, recordPreferencesConfigured: true }),
};

function TestApp() {
  return (
    <AuthProvider service={authService}>
      <TripProvider repository={tripRepository}>
        <ProfileProvider repository={profileRepository}><MemoryRouter initialEntries={['/trips']}>
          <Routes>
            <Route element={<AppShell />}>
              <Route path="/trips" element={<TripsPage />} />
              <Route path="/overview" element={<OverviewPage />} />
              <Route path="/preparation" element={<PreparationPage />} />
              <Route path="/itinerary" element={<ItineraryPage />} />
              <Route path="/archive" element={<ArchivePage />} />
            </Route>
          </Routes>
        </MemoryRouter></ProfileProvider>
      </TripProvider>
    </AuthProvider>
  );
}

describe('TripFlow navigation', () => {
  it('renders the trips page and navigates to the overview', async () => {
    const user = userEvent.setup();
    render(<TestApp />);

    expect(
      await screen.findByRole('heading', { name: '我的旅行' }),
    ).toBeInTheDocument();

    const desktopNavigation = screen.getByRole('navigation', {
      name: '主导航',
    });
    await user.click(
      within(desktopNavigation).getByRole('link', { name: '旅行总览' }),
    );

    expect(screen.getByRole('heading', { name: '旅行总览' })).toBeInTheDocument();
  });
});
