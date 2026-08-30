import migrationSql from '../../supabase/migrations/20260831000100_create_tripflow_core.sql?raw';
import cloudMigrationSql from '../../supabase/migrations/20260831000200_create_trip_with_days_function.sql?raw';
import archiveMigrationSql from '../../supabase/migrations/20260831000300_create_archive.sql?raw';
import travelModeMigrationSql from '../../supabase/migrations/20260831000400_add_trip_timezone_and_itinerary_address.sql?raw';

const tables = [
  'trips',
  'trip_days',
  'preparation_items',
  'itinerary_items',
];

describe('TripFlow database migration', () => {
  it.each(tables)('enables RLS and scopes CRUD policies for %s', (table) => {
    expect(migrationSql).toContain(
      `alter table public.${table} enable row level security;`,
    );
    expect(migrationSql).toMatch(
      new RegExp(
        `on public\\.${table} for select to authenticated[\\s\\S]*?auth\\.uid\\(\\)\\) = user_id`,
      ),
    );
    expect(migrationSql).toMatch(
      new RegExp(
        `on public\\.${table} for insert to authenticated[\\s\\S]*?auth\\.uid\\(\\)\\) = user_id`,
      ),
    );
    expect(migrationSql).toMatch(
      new RegExp(
        `on public\\.${table} for update to authenticated[\\s\\S]*?auth\\.uid\\(\\)\\) = user_id`,
      ),
    );
    expect(migrationSql).toMatch(
      new RegExp(
        `on public\\.${table} for delete to authenticated[\\s\\S]*?auth\\.uid\\(\\)\\) = user_id`,
      ),
    );
  });

  it('enforces parent ownership with composite foreign keys', () => {
    expect(migrationSql).toContain('foreign key (trip_id, user_id)');
    expect(migrationSql).toContain(
      'foreign key (trip_day_id, trip_id, user_id)',
    );
    expect(migrationSql).toContain('references auth.users (id) on delete cascade');
  });

  it('does not grant anonymous access', () => {
    for (const table of tables) {
      expect(migrationSql).toContain(`revoke all on public.${table} from anon;`);
    }
  });
});

describe('atomic trip creation migration', () => {
  it('creates trip and trip days in one security-invoker function', () => {
    expect(cloudMigrationSql).toContain(
      'function public.create_trip_with_days',
    );
    expect(cloudMigrationSql).toContain('security invoker');
    expect(cloudMigrationSql).toContain('insert into public.trips');
    expect(cloudMigrationSql).toContain('insert into public.trip_days');
    expect(cloudMigrationSql).toContain('v_user_id uuid := auth.uid()');
  });

  it('only grants execution to authenticated users', () => {
    expect(cloudMigrationSql).toContain('from public, anon;');
    expect(cloudMigrationSql).toContain('to authenticated;');
  });
});

describe('Phase 03A archive migration', () => {
  const archiveTables = ['expenses', 'purchases', 'media_notes', 'journals'];
  it.each(archiveTables)('enables RLS and revokes anon for %s', (table) => {
    expect(archiveMigrationSql).toContain(`alter table public.${table} enable row level security;`);
    expect(archiveMigrationSql).toContain(`public.${table}`);
  });
  it('defines separate owned CRUD policies including update checks', () => {
    expect(archiveMigrationSql).toContain("for select to authenticated using");
    expect(archiveMigrationSql).toContain("for insert to authenticated with check");
    expect(archiveMigrationSql).toContain("for update to authenticated using");
    expect(archiveMigrationSql).toContain("with check ((select auth.uid()) = user_id)");
    expect(archiveMigrationSql).toContain("for delete to authenticated using");
  });
  it('uses cascading ownership foreign keys and one journal per day', () => {
    expect(archiveMigrationSql).toContain('references public.trips(id,user_id) on delete cascade');
    expect(archiveMigrationSql).toContain('references public.trip_days(id,trip_id,user_id) on delete cascade');
    expect(archiveMigrationSql).toContain('references public.itinerary_items(id,trip_id,user_id) on delete cascade');
    expect(archiveMigrationSql).toContain('unique(user_id,trip_day_id)');
  });
  it('adds paired budget fields without exchange-rate assumptions', () => {
    expect(archiveMigrationSql).toContain('budget_amount numeric(14, 2)');
    expect(archiveMigrationSql).toContain('budget_currency text');
    expect(archiveMigrationSql).toContain('trips_budget_pair_check');
  });
});

describe('Phase 03B travel mode migration',()=>{
  it('adds a validated IANA timezone and optional itinerary timing/address',()=>{expect(travelModeMigrationSql).toContain('function public.is_valid_timezone');expect(travelModeMigrationSql).toContain('pg_catalog.pg_timezone_names');expect(travelModeMigrationSql).toContain("add column timezone text not null");expect(travelModeMigrationSql).toContain("alter column time drop not null");expect(travelModeMigrationSql).toContain("add column address text not null default ''");});
  it('creates an authenticated timezone-aware atomic trip function',()=>{expect(travelModeMigrationSql).toContain('function public.create_trip_with_days_v2');expect(travelModeMigrationSql).toContain('security invoker');expect(travelModeMigrationSql).toContain('from public, anon');expect(travelModeMigrationSql).toContain('to authenticated');});
});
