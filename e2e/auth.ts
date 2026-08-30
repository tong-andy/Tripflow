import type { Page } from '@playwright/test';

export async function installAuthenticatedSession(page: Page) {
  await page.addInitScript(() => {
    const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60 * 24;
    window.localStorage.setItem(
      'tripflow:supabase-auth',
      JSON.stringify({
        access_token: 'e2e-access-token',
        refresh_token: 'e2e-refresh-token',
        expires_at: expiresAt,
        expires_in: 60 * 60 * 24,
        token_type: 'bearer',
        user: {
          id: 'e2e-user',
          aud: 'authenticated',
          email: 'e2e@example.com',
          app_metadata: {},
          user_metadata: {},
          created_at: '2026-08-31T00:00:00.000Z',
        },
      }),
    );
  });
}
