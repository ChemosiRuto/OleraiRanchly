import { createClient } from '@/lib/supabase/client';

export type ListingCategory =
  | 'Livestock'
  | 'Feed'
  | 'Supplements'
  | 'Equipment'
  | 'Medicines'
  | 'Produce'
  | 'Transport'
  | 'Services'
  | 'Other';

export type ListingStatus = 'Active' | 'Sold' | 'Hidden';

export type MarketplaceListing = {
  id: string;
  ownerId: string;
  category: ListingCategory;
  title: string;
  description: string | null;
  priceKsh: number;
  negotiable: boolean;
  attributes: Record<string, string>;
  locationCounty: string;
  contactName: string | null;
  contactPhone: string | null;
  status: ListingStatus;
  createdAt: string;
  updatedAt: string;
};

export type NewListingInput = {
  category: ListingCategory;
  title: string;
  description: string | null;
  price_ksh: number;
  negotiable: boolean;
  attributes: Record<string, string>;
  location_county: string;
  contact_name: string | null;
  contact_phone: string | null;
};

export class MarketplaceDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MarketplaceDataError';
  }
}

export const LISTING_CATEGORIES: ListingCategory[] = [
  'Livestock',
  'Feed',
  'Supplements',
  'Equipment',
  'Medicines',
  'Produce',
  'Transport',
  'Services',
  'Other',
];

export const KENYA_COUNTIES = [
  'Bomet',
  'Bungoma',
  'Baringo',
  'Embu',
  'Elgeyo-Marakwet',
  'Garissa',
  'Homa Bay',
  'Kajiado',
  'Kakamega',
  'Kericho',
  'Kiambu',
  'Kilifi',
  'Kisii',
  'Kisumu',
  'Kitui',
  'Kwale',
  'Laikipia',
  'Machakos',
  'Makueni',
  'Meru',
  'Migori',
  'Mombasa',
  'Nakuru',
  'Nandi',
  'Narok',
  'Nairobi',
  'Nyeri',
  'Nyamira',
  'Nyandarua',
  'Trans Nzoia',
  'Turkana',
  'Uasin Gishu',
  'Vihiga',
  'West Pokot',
  'Other',
];

function marketplaceServiceMessage(error: { code?: string } | null | undefined) {
  if (error?.code === 'PGRST205' || error?.code === '42P01') {
    return 'The marketplace is not configured yet. Apply the listings migration in Supabase, then try again.';
  }
  if (error?.code === '42501') return 'You do not have permission to do that.';
  return 'We could not update the marketplace. Please try again.';
}

type ListingRow = NewListingInput & {
  id: string;
  owner_id: string;
  photo_path: string | null;
  status: ListingStatus;
  created_at: string;
  updated_at: string;
};

function toMarketplaceListing(row: ListingRow): MarketplaceListing {
  return {
    id: row.id,
    ownerId: row.owner_id,
    category: row.category,
    title: row.title,
    description: row.description,
    priceKsh: Number(row.price_ksh),
    negotiable: row.negotiable,
    attributes: (row.attributes ?? {}) as Record<string, string>,
    locationCounty: row.location_county,
    contactName: row.contact_name,
    contactPhone: row.contact_phone,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function loadMarketplaceListings(): Promise<MarketplaceListing[]> {
  const supabase = createClient();
  if (!supabase) throw new MarketplaceDataError('Supabase is not configured.');

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new MarketplaceDataError('Your session expired. Sign in again to browse the marketplace.');

  const { data, error } = await supabase
    .from('marketplace_listings')
    .select('*')
    .eq('status', 'Active')
    .order('created_at', { ascending: false });

  if (error) throw new MarketplaceDataError(marketplaceServiceMessage(error));
  return (data as unknown as ListingRow[]).map(toMarketplaceListing);
}

export async function loadMyMarketplaceListings(): Promise<MarketplaceListing[]> {
  const supabase = createClient();
  if (!supabase) throw new MarketplaceDataError('Supabase is not configured.');

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new MarketplaceDataError('Your session expired. Sign in again to view your listings.');

  const { data, error } = await supabase
    .from('marketplace_listings')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw new MarketplaceDataError(marketplaceServiceMessage(error));
  return (data as unknown as ListingRow[]).map(toMarketplaceListing);
}

export async function createMarketplaceListing(input: NewListingInput): Promise<MarketplaceListing> {
  const supabase = createClient();
  if (!supabase) throw new MarketplaceDataError('Supabase is not configured.');

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new MarketplaceDataError('Your session expired. Sign in again before posting a listing.');

  const { data, error } = await supabase
    .from('marketplace_listings')
    .insert({ ...input, owner_id: user.id, status: 'Active' })
    .select('*')
    .single();

  if (error) throw new MarketplaceDataError(marketplaceServiceMessage(error));
  return toMarketplaceListing(data as unknown as ListingRow);
}

export async function deleteMarketplaceListing(listingId: string): Promise<void> {
  const supabase = createClient();
  if (!supabase) throw new MarketplaceDataError('Supabase is not configured.');

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new MarketplaceDataError('Your session expired. Sign in again to remove this listing.');

  const { error } = await supabase
    .from('marketplace_listings')
    .delete()
    .eq('id', listingId)
    .eq('owner_id', user.id);

  if (error) throw new MarketplaceDataError(marketplaceServiceMessage(error));
}