-- Extensions (needed for gen_random_uuid)
create extension if not exists pgcrypto;

-- Table
create table if not exists public.pre_registrations (
  id uuid primary key default gen_random_uuid(),
  -- Prefer explicit name fields; keep full_name nullable for backward compatibility
  first_name text,
  middle_name text,
  last_name text,
  full_name text,
  contact_number text,
  relation text,
  id_number text,
  photo_url text,
  created_at timestamptz not null default now(),
  status text not null check (status in ('PENDING','IMPORTED','REJECTED')) default 'PENDING'
);

-- RLS
alter table public.pre_registrations enable row level security;

-- Policy: allow anonymous inserts of minimal fields (idempotent)
drop policy if exists prereg_insert on public.pre_registrations;
create policy prereg_insert on public.pre_registrations
for insert to anon
with check (true);

-- Optional: allow public read if you need to display submissions back to users
drop policy if exists prereg_read_public on public.pre_registrations;
create policy prereg_read_public on public.pre_registrations
for select to anon
using (true);
-- Lock down updates/deletes to service role only (no anon)
-- In Supabase, set policy to none for anon on update/delete.
