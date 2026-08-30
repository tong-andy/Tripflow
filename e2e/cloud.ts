import type { Page, Route } from '@playwright/test';

interface CloudRow {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

interface CloudStore {
  trips: CloudRow[];
  trip_days: CloudRow[];
  preparation_items: CloudRow[];
  itinerary_items: CloudRow[];
  expenses: CloudRow[];
  purchases: CloudRow[];
  media_notes: CloudRow[];
  journals: CloudRow[];
  user_profiles: CloudRow[];
}

const user = {
  id: 'e2e-user',
  aud: 'authenticated',
  email: 'e2e@example.com',
  app_metadata: {},
  user_metadata: {},
  created_at: '2026-08-31T00:00:00.000Z',
};

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

function requestedId(url: URL): string | undefined {
  const value = url.searchParams.get('id');
  return value?.startsWith('eq.') ? value.slice(3) : undefined;
}

function datesBetween(startValue: string, endValue: string): string[] {
  const dates: string[] = [];
  const end = new Date(`${endValue}T00:00:00Z`);
  const cursor = new Date(`${startValue}T00:00:00Z`);
  while (cursor <= end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

export async function installCloudApiMock(page: Page) {
  const store: CloudStore = {
    trips: [],
    trip_days: [],
    preparation_items: [],
    itinerary_items: [],
    expenses: [],
    purchases: [],
    media_notes: [],
    journals: [],
    user_profiles: [],
  };
  let idSequence = 0;
  const nextId = (prefix: string) => `${prefix}-${++idSequence}`;
  const timestamp = () => new Date().toISOString();

  await page.route('**/auth/v1/token**', (route) =>
    json(route, {
      access_token: 'cloud-access-token',
      refresh_token: 'cloud-refresh-token',
      expires_in: 3600,
      token_type: 'bearer',
      user,
    }),
  );
  await page.route('**/auth/v1/logout**', (route) =>
    route.fulfill({ status: 204 }),
  );

  await page.route('**/rest/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const segments = url.pathname.split('/').filter(Boolean);
    const resource = segments.at(-1);
    const method = request.method();

    if ((resource === 'create_trip_with_days' || resource === 'create_trip_with_days_v2') && method === 'POST') {
      const input = request.postDataJSON() as Record<string, string>;
      const tripId = nextId('trip');
      const now = timestamp();
      store.trips.push({
        id: tripId,
        user_id: user.id,
        name: input.p_name,
        destination: input.p_destination,
        departure_location: input.p_departure_location,
        start_date: input.p_start_date,
        end_date: input.p_end_date,
        created_at: now,
        updated_at: now,
        budget_amount: null,
        budget_currency: null,
        timezone: input.p_timezone ?? 'Asia/Shanghai',
      });
      datesBetween(input.p_start_date, input.p_end_date).forEach(
        (date, index) => {
          store.trip_days.push({
            id: nextId('day'),
            trip_id: tripId,
            user_id: user.id,
            day_number: index + 1,
            date,
            created_at: now,
            updated_at: now,
          });
        },
      );
      await json(route, tripId);
      return;
    }

    if (
      !resource ||
      ![
        'trips',
        'trip_days',
        'preparation_items',
        'itinerary_items',
        'expenses',
        'purchases',
        'media_notes',
        'journals',
        'user_profiles',
      ].includes(resource)
    ) {
      await json(route, { message: 'Unknown mocked resource' }, 404);
      return;
    }

    const table = resource as keyof CloudStore;
    const rows = store[table];

    if (method === 'GET') {
      let result = [...rows];
      for (const field of ['id', 'user_id', 'trip_id'] as const) {
        const filter = url.searchParams.get(field);
        if (filter?.startsWith('eq.')) {
          const expected = filter.slice(3);
          result = result.filter((row) => row[field] === expected);
        }
      }
      for (const filter of url.searchParams.getAll('date')) {
        if (filter.startsWith('gte.')) {
          result = result.filter((row) => String(row.date) >= filter.slice(4));
        } else if (filter.startsWith('lt.')) {
          result = result.filter((row) => String(row.date) < filter.slice(3));
        }
      }
      await json(route, result);
      return;
    }

    if (method === 'POST') {
      const rawInput = request.postDataJSON() as
        | Record<string, unknown>
        | Array<Record<string, unknown>>;
      const inputs = Array.isArray(rawInput) ? rawInput : [rawInput];
      const created = inputs.map((input) => {
        const now = timestamp();
        const singular = table === 'preparation_items' ? 'prep' : table === 'itinerary_items' ? 'itinerary' : table.replace(/_items$|s$/,'');
        const existingProfile = table === 'user_profiles'
          ? rows.find((candidate) => candidate.user_id === user.id)
          : undefined;
        if (existingProfile) {
          Object.assign(existingProfile, input, { updated_at: now });
          return existingProfile;
        }
        const row: CloudRow = {
          id: table === 'user_profiles' ? user.id : nextId(singular),
          user_id: user.id,
          created_at: now,
          updated_at: now,
          completed: false,
          notes: '',
          status: 'planned',
          organized: false,
          favorite: false,
          purchased: false,
          include_in_expenses: true,
          ...input,
        };
        rows.push(row);
        return row;
      });
      await json(route, Array.isArray(rawInput) ? created : created[0]);
      return;
    }

    const id = requestedId(url);
    const row = rows.find((candidate) => candidate.id === id);

    if (method === 'PATCH' && row) {
      const updates = request.postDataJSON() as Record<string, unknown>;
      Object.assign(row, updates, { updated_at: timestamp() });
      await json(route, row);
      return;
    }

    if (method === 'DELETE') {
      const index = rows.findIndex((candidate) => candidate.id === id);
      if (index >= 0) rows.splice(index, 1);
      if (table === 'trips' && id) {
        store.trip_days = store.trip_days.filter((row) => row.trip_id !== id);
        store.preparation_items = store.preparation_items.filter(
          (row) => row.trip_id !== id,
        );
        store.itinerary_items = store.itinerary_items.filter(
          (row) => row.trip_id !== id,
        );
        store.expenses = store.expenses.filter((row) => row.trip_id !== id);
        store.purchases = store.purchases.filter((row) => row.trip_id !== id);
        store.media_notes = store.media_notes.filter((row) => row.trip_id !== id);
        store.journals = store.journals.filter((row) => row.trip_id !== id);
      }
      await json(route, []);
      return;
    }

    await json(route, { message: 'Mocked row not found' }, 404);
  });

  return store;
}
