-- RentRequests table and helpers
-- Run this SQL in your Supabase project (SQL editor or migration)

create extension if not exists "pgcrypto";

create table if not exists public."RentRequests" (
  id uuid primary key default gen_random_uuid(),
  locale text not null,
  carId text,
  quoteId uuid references public."ContactQuotes"(id),
  humanId text unique,
  contactName text not null,
  contactEmail text not null,
  contactPhone text,
  rentalStart date,
  rentalEnd date,
  status text not null default 'new' check (status in ('new', 'in_progress', 'answered', 'closed')),
  updated text,
  payload jsonb,
  "createdAt" timestamptz not null default timezone('utc', now()),
  "updatedAt" timestamptz not null default timezone('utc', now())
);

create or replace function public.set_rentrequests_updated_at()
returns trigger as $$
begin
  new."updatedAt" = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_rentrequests_updated_at on public."RentRequests";
create trigger trg_rentrequests_updated_at
before update on public."RentRequests"
for each row execute function public.set_rentrequests_updated_at();

create index if not exists idx_rentrequests_status on public."RentRequests"(status);
create index if not exists idx_rentrequests_created_at on public."RentRequests"("createdAt");
create index if not exists idx_rentrequests_car on public."RentRequests"(carId);
