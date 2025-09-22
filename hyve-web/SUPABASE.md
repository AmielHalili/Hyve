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

Attendance via QR check-in

- Add a check-in token to events and an attendance table.

```sql
-- Token used to verify QR check-in links
alter table public.events add column if not exists attend_token text;

-- Track attended events
create table if not exists public.event_attendance (
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

alter table public.event_attendance enable row level security;

-- A user can see their own attendance
create policy if not exists att_select_own on public.event_attendance for select using (
  auth.uid() = user_id
);

-- A user can mark themselves attended when they have the valid token flow (handled in app)
create policy if not exists att_insert_self on public.event_attendance for insert with check (
  auth.uid() = user_id
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

Education / Work fields

Add optional fields to profiles for Student/Workforce selection and details:

```sql
alter table public.profiles
  add column if not exists role_type text check (role_type in ('student','workforce')),
  add column if not exists student_major text,
  add column if not exists job_category text;
```

App will upsert these via Dashboard under the “Education / Work” section.

Social links

Add optional social link columns to profiles. The app displays icons next to the dashboard title and allows editing in Settings.

```sql
alter table public.profiles
  add column if not exists twitter_url text,
  add column if not exists instagram_url text,
  add column if not exists linkedin_url text;
```

Onboarding flow

- The Sign Up page collects name/email/password and navigates to `/onboarding/interests`.
- The onboarding page upserts the user's profile with `full_name` and `onboarding_complete=true`, upserts selected tags into `public.tags` with `owner_id = auth.uid()`, and navigates to Dashboard.

RSVPs

```sql
create table if not exists public.event_rsvps (
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

alter table public.event_rsvps enable row level security;

drop policy if exists rsvps_select_public on public.event_rsvps;
drop policy if exists rsvps_insert_auth on public.event_rsvps;
drop policy if exists rsvps_delete_own on public.event_rsvps;

-- Anyone can read RSVP counts
create policy rsvps_select_public on public.event_rsvps for select using ( true );

-- Any authenticated user can RSVP
create policy rsvps_insert_auth on public.event_rsvps for insert with check ( auth.uid() = user_id );

-- A user can remove their own RSVP
create policy rsvps_delete_own on public.event_rsvps for delete using ( auth.uid() = user_id );
```

Connections

```sql
create table if not exists public.user_connections (
  user_id uuid not null references auth.users(id) on delete cascade,
  peer_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, peer_id)
);

alter table public.user_connections enable row level security;

drop policy if exists conns_select_own on public.user_connections;
drop policy if exists conns_insert_own on public.user_connections;
drop policy if exists conns_delete_own on public.user_connections;

-- A user can see rows where they are involved
create policy conns_select_own on public.user_connections for select using (
  auth.uid() = user_id or auth.uid() = peer_id
);

-- A user can connect to someone (creates a directed edge)
create policy conns_insert_own on public.user_connections for insert with check (
  auth.uid() = user_id and user_id <> peer_id
);

-- Allow disconnecting
create policy conns_delete_own on public.user_connections for delete using (
  auth.uid() = user_id or auth.uid() = peer_id
);
```

Friend requests

```sql
create table if not exists public.connection_requests (
  requester_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending', -- 'pending' | 'accepted' | 'declined'
  created_at timestamptz not null default now(),
  primary key (requester_id, recipient_id)
);

alter table public.connection_requests enable row level security;

drop policy if exists connreq_select_involved on public.connection_requests;
drop policy if exists connreq_insert_self on public.connection_requests;
drop policy if exists connreq_update_recipient on public.connection_requests;

-- Users can see requests they are involved in
create policy connreq_select_involved on public.connection_requests for select using (
  auth.uid() = requester_id or auth.uid() = recipient_id
);

-- Only requester can create a request
create policy connreq_insert_self on public.connection_requests for insert with check (
  auth.uid() = requester_id and requester_id <> recipient_id
);

-- Only the recipient can update (accept/decline)
create policy connreq_update_recipient on public.connection_requests for update using (
  auth.uid() = recipient_id
);
```

Buzz Points / Buzz Levels System

To enable Buzz Levels based on Buzz Points (stored in the `xp` column):

1) Add Buzz Points column to profiles

```sql
alter table public.profiles
  add column if not exists xp integer not null default 0;
```

2) (Optional) Audit Buzz Points changes

```sql
create table if not exists public.xp_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  delta integer not null,
  reason text not null,
  created_at timestamptz not null default now()
);
create index if not exists xp_events_user_idx on public.xp_events(user_id);
```

3) (Optional) Convenience function to award Buzz Points atomically

```sql
create or replace function public.award_xp(p_user uuid, p_delta integer, p_reason text)
returns void
language plpgsql
as $$
begin
  update public.profiles set xp = coalesce(xp,0) + p_delta where id = p_user;
  insert into public.xp_events(user_id, delta, reason) values (p_user, p_delta, p_reason);
end;
$$;
```

App behavior once `xp` (Buzz Points) exists:
- New signups initialize at 50 Buzz Points (src/store/auth.tsx).
- Hosting an event adds +50 Buzz Points (src/pages/Host.tsx) — can be swapped for `rpc('award_xp', ...)` if you added the function.
- Dashboard shows Buzz Level and progress computed from total Buzz Points (src/lib/xp.ts and src/pages/Dashboard.tsx).
- Accepting a connection request awards +10 Buzz Points to both users (src/pages/Dashboard.tsx).
- Checking in (attending via QR) awards +25 Buzz Points on first check-in (src/pages/AttendEvent.tsx).

Buzz Level rules (in code):
- Buzz Level 1 requires 100 Buzz Points; each next Level requires +25 more than the previous (Level 2 +125, Level 3 +150, …). Level is computed from total Buzz Points by summing this series.
