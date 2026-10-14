create table if not exists public.animals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  tag_number text not null check (length(btrim(tag_number)) between 1 and 40),
  name text not null check (length(btrim(name)) between 1 and 120),
  animal_type text not null check (animal_type in ('Cattle', 'Goat', 'Sheep', 'Pig', 'Other Livestock')),
  other_animal_type text,
  breed text not null check (length(btrim(breed)) between 1 and 120),
  sex text not null check (sex in ('Female', 'Male', 'Unknown')),
  color_markings text,
  purpose text check (purpose in ('Dairy', 'Meat', 'Wool', 'Dual-purpose', 'Pork', 'Other')),
  photo_path text,
  acquisition_method text not null check (acquisition_method in ('Born on Farm', 'Bought', 'Consigned/Received')),

  date_of_birth date,
  mother_dam_tag text,
  father_sire_tag text,
  birth_type text check (birth_type in ('Single', 'Twin', 'Triplet', 'Multiple', 'Other')),
  birth_weight_kg numeric(7, 2) check (birth_weight_kg is null or birth_weight_kg >= 0),

  purchase_date date,
  purchase_price_ksh numeric(12, 2) check (purchase_price_ksh is null or purchase_price_ksh >= 0),
  age_at_purchase text,
  seller_name text,
  seller_phone text,
  purchase_location text,

  consignment_owner_name text,
  consignment_owner_phone text,
  date_received date,
  expected_return_date date,
  consignment_reason text,

  breeding_status text check (breeding_status in ('Not breeding', 'Open', 'Bred', 'Pregnant', 'Lactating', 'Dry', 'Unknown')),
  first_breeding_date date,
  last_mating_date date,
  expected_delivery_date date,
  breeding_notes text,

  health_status text not null default 'Unknown' check (health_status in ('Healthy', 'Needs attention', 'Under treatment', 'Unknown')),
  vaccination_date date,
  next_vaccination_date date,
  deworming_date date,
  next_deworming_date date,
  health_notes text,

  ownership_type text not null check (ownership_type in ('Owned', 'Consigned/Received')),
  animal_status text not null default 'Active' check (animal_status in ('Active', 'Quarantined', 'Sold', 'Deceased', 'Transferred')),
  additional_notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint animals_acquisition_details_check check (
    (acquisition_method = 'Born on Farm'
      and date_of_birth is not null
      and birth_type is not null
      and birth_weight_kg is not null
      and purchase_date is null
      and purchase_price_ksh is null
      and seller_name is null
      and seller_phone is null
      and purchase_location is null
      and date_received is null
      and consignment_reason is null)
    or
    (acquisition_method = 'Bought'
      and purchase_date is not null
      and purchase_price_ksh is not null
      and seller_name is not null
      and seller_phone is not null
      and purchase_location is not null
      and date_of_birth is null
      and date_received is null
      and consignment_reason is null)
    or
    (acquisition_method = 'Consigned/Received'
      and consignment_owner_name is not null
      and consignment_owner_phone is not null
      and date_received is not null
      and consignment_reason is not null
      and date_of_birth is null
      and purchase_date is null
      and purchase_price_ksh is null
      and seller_name is null
      and seller_phone is null
      and purchase_location is null)
  ),
  constraint animals_other_type_check check (
    (animal_type = 'Other Livestock' and other_animal_type is not null and length(btrim(other_animal_type)) between 1 and 80)
    or (animal_type <> 'Other Livestock' and other_animal_type is null)
  ),
  constraint animals_breeding_sex_check check (
    sex = 'Female'
    or (breeding_status is null and first_breeding_date is null and last_mating_date is null and expected_delivery_date is null and breeding_notes is null)
  ),
  constraint animals_ownership_acquisition_check check (
    (acquisition_method = 'Consigned/Received' and ownership_type = 'Consigned/Received')
    or (acquisition_method <> 'Consigned/Received' and ownership_type = 'Owned')
  ),
  constraint animals_return_after_received_check check (
    expected_return_date is null or date_received is null or expected_return_date >= date_received
  )
);

create unique index if not exists animals_owner_tag_number_unique
  on public.animals (owner_id, lower(btrim(tag_number)));

create index if not exists animals_owner_created_at_idx
  on public.animals (owner_id, created_at desc);

alter table public.animals enable row level security;

drop policy if exists "Users can read their own animals" on public.animals;
create policy "Users can read their own animals"
  on public.animals for select to authenticated
  using ((select auth.uid()) = owner_id);

drop policy if exists "Users can create their own animals" on public.animals;
create policy "Users can create their own animals"
  on public.animals for insert to authenticated
  with check ((select auth.uid()) = owner_id);

drop policy if exists "Users can update their own animals" on public.animals;
create policy "Users can update their own animals"
  on public.animals for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

drop policy if exists "Users can delete their own animals" on public.animals;
create policy "Users can delete their own animals"
  on public.animals for delete to authenticated
  using ((select auth.uid()) = owner_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('animal-photos', 'animal-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can read their own animal photos" on storage.objects;
create policy "Users can read their own animal photos"
  on storage.objects for select to authenticated
  using (bucket_id = 'animal-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Users can upload their own animal photos" on storage.objects;
create policy "Users can upload their own animal photos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'animal-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Users can update their own animal photos" on storage.objects;
create policy "Users can update their own animal photos"
  on storage.objects for update to authenticated
  using (bucket_id = 'animal-photos' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'animal-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "Users can delete their own animal photos" on storage.objects;
create policy "Users can delete their own animal photos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'animal-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
