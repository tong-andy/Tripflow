import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './app/router';
import { AuthProvider } from './state/AuthProvider';
import { TripProvider } from './state/TripProvider';
import { ArchiveProvider } from './state/ArchiveProvider';
import { NetworkProvider } from './state/NetworkProvider';
import { registerTripFlowServiceWorker } from './pwa';
import './styles/index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

registerTripFlowServiceWorker();

createRoot(rootElement).render(
  <StrictMode>
    <NetworkProvider><AuthProvider>
      <TripProvider>
        <ArchiveProvider>
          <RouterProvider router={router} />
        </ArchiveProvider>
      </TripProvider>
    </AuthProvider></NetworkProvider>
  </StrictMode>,
);
