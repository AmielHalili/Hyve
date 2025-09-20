Hyve Events — Supabase Setup

Tables

- events
  - id uuid primary key default gen_random_uuid()
  - title text not null
  - description text
  - location text not null
  - starts_at timestamptz not null
  - owner_id uuid not null references auth.users(id)
  - created_at timestamptz not null default now()

SQL

```sql
create extension if not exists pgcrypto;

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  title text not null,
  description text,
  location text not null,
  starts_at timestamptz not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  cover_url text
);

alter table public.events enable row level security;

-- Read public events and events owned by the user
create policy if not exists "events_select_public_or_own"
on public.events for select
using (
  true -- make all events readable; tighten later if needed
);

-- Only owners can insert their events
create policy if not exists "events_insert_owner"
on public.events for insert
with check ( owner_id = auth.uid() );

-- Only owners can update/delete their events
create policy if not exists "events_update_owner"
on public.events for update
using ( owner_id = auth.uid() );

create policy if not exists "events_delete_owner"
on public.events for delete
using ( owner_id = auth.uid() );
```

Notes

- If you want events readable only when `is_public = true`, add an `is_public boolean default true` column and adjust the select policy accordingly.
- Client inserts set `owner_id` to the authenticated user in `Host.tsx`.
- Time is stored in `starts_at` as UTC; the UI formats with `toLocaleString()`.
- To add `slug` to an existing table, run:
  ```sql
  alter table public.events add column if not exists slug text unique;
  create unique index if not exists events_slug_key on public.events(slug);
  ```

Images (cover + gallery)

- Storage: create a public bucket named `event-images` in Supabase Storage.
  - Public read enabled
  - Add storage policies (SQL) to allow authenticated uploads and public reads:
    ```sql
    -- Public read for this bucket
    create policy if not exists "event-images public read"
    on storage.objects for select
    using (bucket_id = 'event-images');

    -- Authenticated users can upload new files to this bucket
    create policy if not exists "event-images auth upload"
    on storage.objects for insert
    with check (bucket_id = 'event-images' and auth.role() = 'authenticated');

    -- (Optional) allow authenticated updates (needed only if you overwrite files)
    create policy if not exists "event-images auth update"
    on storage.objects for update
    using (bucket_id = 'event-images' and auth.role() = 'authenticated')
    with check (bucket_id = 'event-images' and auth.role() = 'authenticated');

    -- (Optional) allow deletes by authenticated users
    create policy if not exists "event-images auth delete"
    on storage.objects for delete
    using (bucket_id = 'event-images' and auth.role() = 'authenticated');
    ```

- Table: event_images (optional convenience index of gallery URLs)

```sql
create table if not exists public.event_images (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  url text not null,
  created_at timestamptz not null default now()
);

alter table public.event_images enable row level security;

drop policy if exists event_images_select_public on public.event_images;
drop policy if exists event_images_insert_owner on public.event_images;

-- Anyone can read (to match public event visibility)
create policy event_images_select_public on public.event_images for select using (true);

-- Only the event owner can insert images
create policy event_images_insert_owner on public.event_images for insert with check (
  exists (select 1 from public.events e where e.id = event_id and e.owner_id = auth.uid())
);
```

Profiles and interests

- profiles
  - id uuid primary key references auth.users(id)
  - full_name text
  - onboarding_complete boolean default false
  - created_at timestamptz default now()

SQL

```sql
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists profiles_select_own on public.profiles;
drop policy if exists profiles_upsert_own on public.profiles;
drop policy if exists profiles_update_own on public.profiles;

create policy profiles_select_own on public.profiles for select using ( id = auth.uid() );
create policy profiles_upsert_own on public.profiles for insert with check ( id = auth.uid() );
create policy profiles_update_own on public.profiles for update using ( id = auth.uid() );
```

Onboarding flow

- The Sign Up page collects name/email/password and navigates to `/onboarding/interests`.
- The onboarding page upserts the user's profile with `full_name` and `onboarding_complete=true`, upserts selected tags into `public.tags` with `owner_id = auth.uid()`, and navigates to Dashboard.
