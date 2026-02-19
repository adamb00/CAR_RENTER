-- RentRequests table and helpers
-- Run this SQL in your Supabase project (SQL editor or migration)
-- This version is aligned with /car_renter_admin Prisma migrations.
-- Prerequisite: contact_quotes.sql should run first.

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
  rentalDays integer,
  status text not null default 'new',
  updated text,
  payload jsonb,
  "createdAt" timestamptz not null default timezone('utc', now()),
  "updatedAt" timestamptz not null default timezone('utc', now())
);

alter table public."RentRequests"
  add column if not exists rentalDays integer;

alter table public."RentRequests"
  alter column status set default 'new';

alter table public."RentRequests"
  drop constraint if exists "RentRequests_status_check";

alter table public."RentRequests"
  add constraint "RentRequests_status_check"
  check (
    status in (
      'new',
      'form_submitted',
      'accepted',
      'registered',
      'cancelled'
    )
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

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'HandoverDirection'
  ) then
    create type "HandoverDirection" as enum ('out', 'in');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'HandoverCostType'
  ) then
    create type "HandoverCostType" as enum ('tip', 'fuel', 'ferry', 'cleaning');
  end if;
end $$;

create table if not exists public."BookingPricingSnapshots" (
  id uuid primary key default gen_random_uuid(),
  "bookingId" uuid not null,
  "rentalFee" text,
  "insurance" text,
  "deposit" text,
  "deliveryFee" text,
  "extrasFee" text,
  "tip" text,
  "createdAt" timestamptz not null default timezone('utc', now()),
  "updatedAt" timestamptz not null default timezone('utc', now())
);

create table if not exists public."BookingDeliveryDetails" (
  id uuid primary key default gen_random_uuid(),
  "bookingId" uuid not null,
  "placeType" text,
  "locationName" text,
  "addressLine" text,
  "arrivalFlight" text,
  "departureFlight" text,
  "arrivalHour" text,
  "arrivalMinute" text,
  "createdAt" timestamptz not null default timezone('utc', now()),
  "updatedAt" timestamptz not null default timezone('utc', now())
);

create table if not exists public."BookingHandoverCosts" (
  id uuid primary key default gen_random_uuid(),
  "bookingId" uuid not null,
  "direction" "HandoverDirection" not null,
  "costType" "HandoverCostType" not null,
  "amount" decimal(12, 2) not null,
  "createdAt" timestamptz not null default timezone('utc', now()),
  "updatedAt" timestamptz not null default timezone('utc', now())
);

create unique index if not exists "BookingPricingSnapshots_bookingId_key"
  on public."BookingPricingSnapshots"("bookingId");
create index if not exists idx_booking_pricing_booking_id
  on public."BookingPricingSnapshots"("bookingId");

create unique index if not exists "BookingDeliveryDetails_bookingId_key"
  on public."BookingDeliveryDetails"("bookingId");
create index if not exists idx_booking_delivery_booking_id
  on public."BookingDeliveryDetails"("bookingId");

create unique index if not exists uniq_booking_handover_cost
  on public."BookingHandoverCosts"("bookingId", "direction", "costType");
create index if not exists idx_booking_handover_cost_booking_id
  on public."BookingHandoverCosts"("bookingId");
create index if not exists idx_booking_handover_cost_direction
  on public."BookingHandoverCosts"("direction");

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'BookingPricingSnapshots_bookingId_fkey'
  ) then
    alter table public."BookingPricingSnapshots"
      add constraint "BookingPricingSnapshots_bookingId_fkey"
      foreign key ("bookingId")
      references public."RentRequests"(id)
      on delete cascade
      on update cascade;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'BookingDeliveryDetails_bookingId_fkey'
  ) then
    alter table public."BookingDeliveryDetails"
      add constraint "BookingDeliveryDetails_bookingId_fkey"
      foreign key ("bookingId")
      references public."RentRequests"(id)
      on delete cascade
      on update cascade;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'BookingHandoverCosts_bookingId_fkey'
  ) then
    alter table public."BookingHandoverCosts"
      add constraint "BookingHandoverCosts_bookingId_fkey"
      foreign key ("bookingId")
      references public."RentRequests"(id)
      on delete cascade
      on update cascade;
  end if;
end $$;

-- Optional backfill for legacy payload blocks.
insert into public."BookingPricingSnapshots" (
  "bookingId",
  "rentalFee",
  "insurance",
  "deposit",
  "deliveryFee",
  "extrasFee",
  "tip",
  "updatedAt"
)
select
  rr.id as "bookingId",
  nullif(btrim(rr.payload->'pricing'->>'rentalFee'), ''),
  nullif(btrim(rr.payload->'pricing'->>'insurance'), ''),
  nullif(btrim(rr.payload->'pricing'->>'deposit'), ''),
  nullif(btrim(rr.payload->'pricing'->>'deliveryFee'), ''),
  nullif(btrim(rr.payload->'pricing'->>'extrasFee'), ''),
  nullif(btrim(rr.payload->'pricing'->>'tip'), ''),
  timezone('utc', now())
from public."RentRequests" rr
where rr.payload is not null
  and rr.payload->'pricing' is not null
on conflict ("bookingId") do update
set
  "rentalFee" = excluded."rentalFee",
  "insurance" = excluded."insurance",
  "deposit" = excluded."deposit",
  "deliveryFee" = excluded."deliveryFee",
  "extrasFee" = excluded."extrasFee",
  "tip" = excluded."tip",
  "updatedAt" = timezone('utc', now());

insert into public."BookingDeliveryDetails" (
  "bookingId",
  "placeType",
  "locationName",
  "addressLine",
  "arrivalFlight",
  "departureFlight",
  "arrivalHour",
  "arrivalMinute",
  "updatedAt"
)
select
  rr.id as "bookingId",
  nullif(btrim(rr.payload->'delivery'->>'placeType'), ''),
  nullif(btrim(rr.payload->'delivery'->>'locationName'), ''),
  nullif(
    btrim(
      coalesce(
        rr.payload->'delivery'->'address'->>'street',
        rr.payload->'delivery'->>'address'
      )
    ),
    ''
  ),
  nullif(btrim(rr.payload->'delivery'->>'arrivalFlight'), ''),
  nullif(btrim(rr.payload->'delivery'->>'departureFlight'), ''),
  nullif(btrim(rr.payload->'delivery'->>'arrivalHour'), ''),
  nullif(btrim(rr.payload->'delivery'->>'arrivalMinute'), ''),
  timezone('utc', now())
from public."RentRequests" rr
where rr.payload is not null
  and rr.payload->'delivery' is not null
on conflict ("bookingId") do update
set
  "placeType" = excluded."placeType",
  "locationName" = excluded."locationName",
  "addressLine" = excluded."addressLine",
  "arrivalFlight" = excluded."arrivalFlight",
  "departureFlight" = excluded."departureFlight",
  "arrivalHour" = excluded."arrivalHour",
  "arrivalMinute" = excluded."arrivalMinute",
  "updatedAt" = timezone('utc', now());

with extracted as (
  select rr.id as booking_id, 'out'::"HandoverDirection" as direction, 'tip'::"HandoverCostType" as cost_type,
         coalesce(rr.payload->>'handoverTip', rr.payload->'pricing'->>'tip') as raw_value
  from public."RentRequests" rr
  where rr.payload is not null

  union all
  select rr.id, 'out'::"HandoverDirection", 'fuel'::"HandoverCostType",
         rr.payload->'handoverCosts'->'out'->>'fuelCost'
  from public."RentRequests" rr
  where rr.payload is not null

  union all
  select rr.id, 'out'::"HandoverDirection", 'ferry'::"HandoverCostType",
         rr.payload->'handoverCosts'->'out'->>'ferryCost'
  from public."RentRequests" rr
  where rr.payload is not null

  union all
  select rr.id, 'out'::"HandoverDirection", 'cleaning'::"HandoverCostType",
         rr.payload->'handoverCosts'->'out'->>'cleaningCost'
  from public."RentRequests" rr
  where rr.payload is not null

  union all
  select rr.id, 'in'::"HandoverDirection", 'fuel'::"HandoverCostType",
         rr.payload->'handoverCosts'->'in'->>'fuelCost'
  from public."RentRequests" rr
  where rr.payload is not null

  union all
  select rr.id, 'in'::"HandoverDirection", 'ferry'::"HandoverCostType",
         rr.payload->'handoverCosts'->'in'->>'ferryCost'
  from public."RentRequests" rr
  where rr.payload is not null

  union all
  select rr.id, 'in'::"HandoverDirection", 'cleaning'::"HandoverCostType",
         rr.payload->'handoverCosts'->'in'->>'cleaningCost'
  from public."RentRequests" rr
  where rr.payload is not null
),
cleaned as (
  select
    booking_id,
    direction,
    cost_type,
    regexp_replace(replace(btrim(coalesce(raw_value, '')), ',', '.'), '[^0-9\\.-]', '', 'g') as normalized
  from extracted
)
insert into public."BookingHandoverCosts" ("bookingId", "direction", "costType", "amount", "updatedAt")
select
  booking_id,
  direction,
  cost_type,
  cast(normalized as decimal(12,2)) as amount,
  timezone('utc', now())
from cleaned
where normalized ~ '^-?[0-9]+(\\.[0-9]+)?$'
on conflict ("bookingId", "direction", "costType") do update
set
  "amount" = excluded."amount",
  "updatedAt" = timezone('utc', now());
