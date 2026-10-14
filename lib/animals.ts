import { createClient } from '@/lib/supabase/client';

export type AnimalStatus = 'Healthy' | 'Due soon' | 'Needs attention';

export type Animal = {
  id: string;
  tagNumber: string;
  name: string;
  species: string;
  breed: string;
  sex: 'Female' | 'Male' | 'Unknown';
  age: string;
  weight: string;
  purpose: string;
  status: AnimalStatus;
  animalStatus: string;
  milk: number;
  color: string;
  photoPath: string | null;

  // Full detailed fields
  animalType: NewAnimalInput['animal_type'];
  otherAnimalType: string | null;
  colorMarkings: string | null;
  acquisitionMethod: NewAnimalInput['acquisition_method'];
  dateOfBirth: string | null;
  motherDamTag: string | null;
  fatherSireTag: string | null;
  birthType: NewAnimalInput['birth_type'];
  birthWeightKg: number | null;
  purchaseDate: string | null;
  purchasePriceKsh: number | null;
  ageAtPurchase: string | null;
  sellerName: string | null;
  sellerPhone: string | null;
  purchaseLocation: string | null;
  consignmentOwnerName: string | null;
  consignmentOwnerPhone: string | null;
  dateReceived: string | null;
  expectedReturnDate: string | null;
  consignmentReason: string | null;
  breedingStatus: NewAnimalInput['breeding_status'];
  firstBreedingDate: string | null;
  lastMatingDate: string | null;
  expectedDeliveryDate: string | null;
  breedingNotes: string | null;
  healthStatus: NewAnimalInput['health_status'];
  vaccinationDate: string | null;
  nextVaccinationDate: string | null;
  dewormingDate: string | null;
  nextDewormingDate: string | null;
  healthNotes: string | null;
  ownershipType: NewAnimalInput['ownership_type'];
  additionalNotes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type NewAnimalInput = {
  tag_number: string;
  name: string;
  animal_type: 'Cattle' | 'Goat' | 'Sheep' | 'Pig' | 'Other Livestock';
  other_animal_type: string | null;
  breed: string;
  sex: 'Female' | 'Male' | 'Unknown';
  color_markings: string | null;
  purpose: 'Dairy' | 'Meat' | 'Wool' | 'Dual-purpose' | 'Pork' | 'Other' | null;
  acquisition_method: 'Born on Farm' | 'Bought' | 'Consigned/Received';
  date_of_birth: string | null;
  mother_dam_tag: string | null;
  father_sire_tag: string | null;
  birth_type: 'Single' | 'Twin' | 'Triplet' | 'Multiple' | 'Other' | null;
  birth_weight_kg: number | null;
  purchase_date: string | null;
  purchase_price_ksh: number | null;
  age_at_purchase: string | null;
  seller_name: string | null;
  seller_phone: string | null;
  purchase_location: string | null;
  consignment_owner_name: string | null;
  consignment_owner_phone: string | null;
  date_received: string | null;
  expected_return_date: string | null;
  consignment_reason: string | null;
  breeding_status: 'Not breeding' | 'Open' | 'Bred' | 'Pregnant' | 'Lactating' | 'Dry' | 'Unknown' | null;
  first_breeding_date: string | null;
  last_mating_date: string | null;
  expected_delivery_date: string | null;
  breeding_notes: string | null;
  health_status: 'Healthy' | 'Needs attention' | 'Under treatment' | 'Unknown';
  vaccination_date: string | null;
  next_vaccination_date: string | null;
  deworming_date: string | null;
  next_deworming_date: string | null;
  health_notes: string | null;
  ownership_type: 'Owned' | 'Consigned/Received';
  animal_status: 'Active' | 'Quarantined' | 'Sold' | 'Deceased' | 'Transferred';
  additional_notes: string | null;
};

type AnimalRow = NewAnimalInput & {
  id: string;
  owner_id: string;
  photo_path: string | null;
  created_at: string;
  updated_at: string;
};

export class AnimalDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AnimalDataError';
  }
}

function animalServiceMessage(error: { code?: string } | null | undefined) {
  if (error?.code === 'PGRST205' || error?.code === '42P01') {
    return 'Animal records are not configured yet. Apply the Farmer animals migration in Supabase, then try again.';
  }
  if (error?.code === '23505') return 'That tag number is already used on this account.';
  if (error?.code === '42501') return 'Your account does not have permission to update this animal record.';
  return 'We could not save animal details. Check the required fields and try again.';
}

function ageFromDate(date: string | null) {
  if (!date) return 'Not recorded';
  const born = new Date(`${date}T00:00:00`);
  if (Number.isNaN(born.getTime())) return 'Not recorded';
  const now = new Date();
  let months = (now.getFullYear() - born.getFullYear()) * 12 + now.getMonth() - born.getMonth();
  if (now.getDate() < born.getDate()) months -= 1;
  if (months < 0) return 'Not recorded';
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (years === 0) return `${remainingMonths} mo`;
  if (remainingMonths === 0) return `${years} yr`;
  return `${years} yr ${remainingMonths} mo`;
}

function toAnimal(row: AnimalRow): Animal {
  const status: AnimalStatus = row.health_status === 'Healthy'
    ? 'Healthy'
    : row.health_status === 'Needs attention' || row.health_status === 'Under treatment'
      ? 'Needs attention'
      : 'Due soon';
  const species = row.animal_type === 'Cattle' ? 'Cow' : row.animal_type === 'Other Livestock' ? row.other_animal_type || 'Other Livestock' : row.animal_type;

  return {
    id: row.id,
    tagNumber: row.tag_number,
    name: row.name,
    species,
    breed: row.breed,
    sex: row.sex,
    age: row.acquisition_method === 'Bought' ? row.age_at_purchase || 'Not recorded' : ageFromDate(row.date_of_birth),
    weight: row.birth_weight_kg === null ? 'Not recorded' : `${row.birth_weight_kg} kg at birth`,
    purpose: row.purpose || 'Not set',
    status,
    animalStatus: row.animal_status,
    milk: 0,
    color: row.color_markings || 'Not recorded',
    photoPath: row.photo_path,

    // Full detailed fields
    animalType: row.animal_type,
    otherAnimalType: row.other_animal_type,
    colorMarkings: row.color_markings,
    acquisitionMethod: row.acquisition_method,
    dateOfBirth: row.date_of_birth,
    motherDamTag: row.mother_dam_tag,
    fatherSireTag: row.father_sire_tag,
    birthType: row.birth_type,
    birthWeightKg: row.birth_weight_kg,
    purchaseDate: row.purchase_date,
    purchasePriceKsh: row.purchase_price_ksh,
    ageAtPurchase: row.age_at_purchase,
    sellerName: row.seller_name,
    sellerPhone: row.seller_phone,
    purchaseLocation: row.purchase_location,
    consignmentOwnerName: row.consignment_owner_name,
    consignmentOwnerPhone: row.consignment_owner_phone,
    dateReceived: row.date_received,
    expectedReturnDate: row.expected_return_date,
    consignmentReason: row.consignment_reason,
    breedingStatus: row.breeding_status,
    firstBreedingDate: row.first_breeding_date,
    lastMatingDate: row.last_mating_date,
    expectedDeliveryDate: row.expected_delivery_date,
    breedingNotes: row.breeding_notes,
    healthStatus: row.health_status,
    vaccinationDate: row.vaccination_date,
    nextVaccinationDate: row.next_vaccination_date,
    dewormingDate: row.deworming_date,
    nextDewormingDate: row.next_deworming_date,
    healthNotes: row.health_notes,
    ownershipType: row.ownership_type,
    additionalNotes: row.additional_notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function loadMyAnimals() {
  const supabase = createClient();
  if (!supabase) throw new AnimalDataError('Supabase is not configured.');

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new AnimalDataError('Your session expired. Sign in again to view your animals.');

  const { data, error } = await supabase
    .from('animals')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw new AnimalDataError(animalServiceMessage(error));
  return (data as unknown as AnimalRow[]).map(toAnimal);
}

export async function createMyAnimal(input: NewAnimalInput, photo: File | null) {
  const supabase = createClient();
  if (!supabase) throw new AnimalDataError('Supabase is not configured.');

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new AnimalDataError('Your session expired. Sign in again before adding an animal.');

  let photoPath: string | null = null;
  if (photo) {
    const extensions: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
    const extension = extensions[photo.type];
    if (!extension || photo.size > 5 * 1024 * 1024) {
      throw new AnimalDataError('Choose a JPG, PNG, or WebP photo smaller than 5 MB.');
    }

    photoPath = `${user.id}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from('animal-photos').upload(photoPath, photo, {
      cacheControl: '3600',
      contentType: photo.type,
      upsert: false,
    });
    if (uploadError) {
      if (uploadError.message.toLowerCase().includes('bucket')) {
        throw new AnimalDataError('Animal photo storage is not configured yet. Apply the Farmer animals migration in Supabase.');
      }
      throw new AnimalDataError('We could not upload that photo. Try another image and try again.');
    }
  }

  const { data, error } = await supabase
    .from('animals')
    .insert({ ...input, owner_id: user.id, photo_path: photoPath })
    .select('*')
    .single();

  if (error) {
    if (photoPath) await supabase.storage.from('animal-photos').remove([photoPath]);
    throw new AnimalDataError(animalServiceMessage(error));
  }

  return toAnimal(data as unknown as AnimalRow);
}

export async function updateMyAnimal(
  id: string,
  input: NewAnimalInput,
  photo: File | null,
  removePhoto: boolean = false
) {
  const supabase = createClient();
  if (!supabase) throw new AnimalDataError('Supabase is not configured.');

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new AnimalDataError('Your session expired. Sign in again to update this animal.');

  // Check current animal to get existing photo path
  const { data: currentAnimal, error: fetchError } = await supabase
    .from('animals')
    .select('photo_path')
    .eq('id', id)
    .eq('owner_id', user.id)
    .single();

  if (fetchError || !currentAnimal) {
    throw new AnimalDataError('Animal record could not be found.');
  }

  let photoPath = currentAnimal.photo_path;

  if (photo) {
    const extensions: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
    const extension = extensions[photo.type];
    if (!extension || photo.size > 5 * 1024 * 1024) {
      throw new AnimalDataError('Choose a JPG, PNG, or WebP photo smaller than 5 MB.');
    }

    const newPhotoPath = `${user.id}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from('animal-photos').upload(newPhotoPath, photo, {
      cacheControl: '3600',
      contentType: photo.type,
      upsert: false,
    });
    if (uploadError) {
      throw new AnimalDataError('We could not upload the new photo. Try again.');
    }

    // Remove old photo if exists
    if (photoPath) {
      await supabase.storage.from('animal-photos').remove([photoPath]);
    }
    photoPath = newPhotoPath;
  } else if (removePhoto && photoPath) {
    await supabase.storage.from('animal-photos').remove([photoPath]);
    photoPath = null;
  }

  const { data, error } = await supabase
    .from('animals')
    .update({
      ...input,
      photo_path: photoPath,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('owner_id', user.id)
    .select('*')
    .single();

  if (error) {
    throw new AnimalDataError(animalServiceMessage(error));
  }

  return toAnimal(data as unknown as AnimalRow);
}

export async function deleteMyAnimal(id: string, photoPath?: string | null) {
  const supabase = createClient();
  if (!supabase) throw new AnimalDataError('Supabase is not configured.');

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new AnimalDataError('Your session expired. Sign in again to delete this animal.');

  const { error } = await supabase
    .from('animals')
    .delete()
    .eq('id', id)
    .eq('owner_id', user.id);

  if (error) throw new AnimalDataError(animalServiceMessage(error));

  if (photoPath) {
    try {
      await supabase.storage.from('animal-photos').remove([photoPath]);
    } catch {
      // Photo removal failure shouldn't block successful animal deletion
    }
  }

  return true;
}

export async function getAnimalPhotoSignedUrl(photoPath: string | null): Promise<string | null> {
  if (!photoPath) return null;
  const supabase = createClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.storage.from('animal-photos').createSignedUrl(photoPath, 3600);
    if (error || !data) return null;
    return data.signedUrl;
  } catch {
    return null;
  }
}
