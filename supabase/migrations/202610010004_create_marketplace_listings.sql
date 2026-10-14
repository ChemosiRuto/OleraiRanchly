create table if not exists public.marketplace_listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  category text not null default 'Other' check (category in ('Livestock', 'Feed', 'Supplements', 'Equipment', 'Medicines', 'Produce', 'Transport', 'Services', 'Other')),
  title text not null check (length(btrim(title)) between 1 and 120),
  description text check (description is null or length(btrim(description)) <= 2000),
  price_ksh numeric(12, 2) not null check (price_ksh >= 0),
  negotiable boolean not null default false,
  attributes jsonb not null default '{}'::jsonb,
  location_county text not null default 'Other' check (length(btrim(location_county)) between 1 and 80),
  contact_name text,
  contact_phone text,
  photo_path text,
  status text not null default 'Active' check (status in ('Active', 'Sold', 'Hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists marketplace_listings_category_created_at_idx
  on public.marketplace_listings (category, created_at desc);

create index if not exists marketplace_listings_owner_created_at_idx
  on public.marketplace_listings (owner_id, created_at desc);

create index if not exists marketplace_listings_status_created_at_idx
  on public.marketplace_listings (status, created_at desc);

alter table public.marketplace_listings enable row level security;

drop policy if exists "Users can browse active marketplace listings" on public.marketplace_listings;
create policy "Users can browse active marketplace listings"
  on public.marketplace_listings for select to authenticated
  using (status = 'Active' or owner_id = (select auth.uid()));

drop policy if exists "Users can create marketplace listings" on public.marketplace_listings;
create policy "Users can create marketplace listings"
  on public.marketplace_listings for insert to authenticated
  with check ((select auth.uid()) = owner_id);

drop policy if exists "Users can update their own marketplace listings" on public.marketplace_listings;
create policy "Users can update their own marketplace listings"
  on public.marketplace_listings for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

drop policy if exists "Users can delete their own marketplace listings" on public.marketplace_listings;
create policy "Users can delete their own marketplace listings"
  on public.marketplace_listings for delete to authenticated
  using (owner_id = (select auth.uid()));