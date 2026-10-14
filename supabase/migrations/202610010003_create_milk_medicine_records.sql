create table if not exists public.milk_records (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  animal_id uuid not null references public.animals(id) on delete cascade,
  amount_litres numeric(6, 2) not null check (amount_litres > 0),
  recorded_on date not null,
  session text not null default 'Any' check (session in ('Morning', 'Evening', 'Any')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.medicine_records (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  animal_id uuid not null references public.animals(id) on delete cascade,
  medicine_name text not null check (length(btrim(medicine_name)) between 1 and 120),
  category text not null default 'Other' check (category in ('Antibiotic', 'Dewormer', 'Vaccine', 'Vitamin/Supplement', 'Pain reliever', 'Other')),
  dosage text,
  dosage_unit text,
  given_on date not null,
  next_due_date date,
  cost_ksh numeric(10, 2) check (cost_ksh is null or cost_ksh >= 0),
  administered_by text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint medicine_records_due_after_given_check check (
    next_due_date is null or given_on is null or next_due_date >= given_on
  )
);

create index if not exists milk_records_owner_created_at_idx
  on public.milk_records (owner_id, created_at desc);

create index if not exists milk_records_animal_date_idx
  on public.milk_records (animal_id, recorded_on desc);

create index if not exists medicine_records_owner_created_at_idx
  on public.medicine_records (owner_id, created_at desc);

create index if not exists medicine_records_animal_date_idx
  on public.medicine_records (animal_id, given_on desc);

alter table public.milk_records enable row level security;
alter table public.medicine_records enable row level security;

drop policy if exists "Users can read their own milk records" on public.milk_records;
create policy "Users can read their own milk records"
  on public.milk_records for select to authenticated
  using ((select auth.uid()) = owner_id);

drop policy if exists "Users can insert their own milk records" on public.milk_records;
create policy "Users can insert their own milk records"
  on public.milk_records for insert to authenticated
  with check (
    (select auth.uid()) = owner_id
    and (select owner_id from public.animals where id = animal_id) = (select auth.uid())
  );

drop policy if exists "Users can update their own milk records" on public.milk_records;
create policy "Users can update their own milk records"
  on public.milk_records for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

drop policy if exists "Users can delete their own milk records" on public.milk_records;
create policy "Users can delete their own milk records"
  on public.milk_records for delete to authenticated
  using ((select auth.uid()) = owner_id);

drop policy if exists "Users can read their own medicine records" on public.medicine_records;
create policy "Users can read their own medicine records"
  on public.medicine_records for select to authenticated
  using ((select auth.uid()) = owner_id);

drop policy if exists "Users can insert their own medicine records" on public.medicine_records;
create policy "Users can insert their own medicine records"
  on public.medicine_records for insert to authenticated
  with check (
    (select auth.uid()) = owner_id
    and (select owner_id from public.animals where id = animal_id) = (select auth.uid())
  );

drop policy if exists "Users can update their own medicine records" on public.medicine_records;
create policy "Users can update their own medicine records"
  on public.medicine_records for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

drop policy if exists "Users can delete their own medicine records" on public.medicine_records;
create policy "Users can delete their own medicine records"
  on public.medicine_records for delete to authenticated
  using ((select auth.uid()) = owner_id);