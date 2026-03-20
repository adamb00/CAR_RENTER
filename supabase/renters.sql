-- Renters table alignment
-- Run this SQL in your Supabase project (SQL editor or migration)
-- Ensures renter email is not unique, so multiple renters can share one email address.

create extension if not exists "pgcrypto";

create table if not exists public."Renters" (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  "taxId" text,
  "companyName" text,
  "paymentMethod" text,
  "createdAt" timestamptz not null default timezone('utc', now()),
  "updatedAt" timestamptz not null default timezone('utc', now()),
  "primaryDriver" jsonb
);

alter table public."RentRequests"
  add column if not exists "renterId" uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'RentRequests_renterId_fkey'
  ) then
    alter table public."RentRequests"
      add constraint "RentRequests_renterId_fkey"
      foreign key ("renterId")
      references public."Renters"(id);
  end if;
end $$;

create index if not exists idx_rentrequests_renter
  on public."RentRequests"("renterId");

create index if not exists idx_renters_name
  on public."Renters"(name);

alter table public."Renters"
  drop constraint if exists "Renters_email_key";

drop index if exists public."Renters_email_key";

