-- ContactQuotes table and helpers
-- Run this SQL in your Supabase project (SQL editor or migration)
-- This version is aligned with /car_renter_admin Prisma migrations.

create extension if not exists "pgcrypto";

create table if not exists public."ContactQuotes" (
  id uuid primary key default gen_random_uuid(),
  locale text not null,
  name text not null,
  email text not null,
  phone text not null,
  preferredChannel text not null check (preferredChannel in ('email', 'phone', 'whatsapp', 'viber')),
  rentalStart date,
  rentalEnd date,
  arrivalFlight text,
  departureFlight text,
  partySize text,
  children text,
  extras text[],
  delivery jsonb,
  "bookingRequestData" jsonb,
  rentalDays integer,
  "offerAccepted" integer,
  carId text,
  carName text,
  status text not null default 'new',
  updated text,
  humanId text unique,
  "createdAt" timestamptz not null default timezone('utc', now()),
  "updatedAt" timestamptz not null default timezone('utc', now())
);

alter table public."ContactQuotes"
  add column if not exists "bookingRequestData" jsonb,
  add column if not exists rentalDays integer,
  add column if not exists "offerAccepted" integer;

alter table public."ContactQuotes"
  alter column status set default 'new';

alter table public."ContactQuotes"
  drop constraint if exists "ContactQuotes_status_check";

alter table public."ContactQuotes"
  add constraint "ContactQuotes_status_check"
  check (status in ('new', 'quote_sent', 'quote_accepted'));

create or replace function public.set_contactquotes_updated_at()
returns trigger as $$
begin
  new."updatedAt" = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_contactquotes_updated_at on public."ContactQuotes";
create trigger trg_contactquotes_updated_at
before update on public."ContactQuotes"
for each row execute function public.set_contactquotes_updated_at();

create index if not exists idx_contactquotes_status on public."ContactQuotes"(status);
create index if not exists idx_contactquotes_created_at on public."ContactQuotes"("createdAt");
