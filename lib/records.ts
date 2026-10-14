import { createClient } from '@/lib/supabase/client';

export type MilkSession = 'Morning' | 'Evening' | 'Any';
export type MedicineCategory =
  | 'Antibiotic'
  | 'Dewormer'
  | 'Vaccine'
  | 'Vitamin/Supplement'
  | 'Pain reliever'
  | 'Other';

export type MilkRecord = {
  id: string;
  animalId: string;
  amountLitres: number;
  recordedOn: string;
  session: MilkSession;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MedicineRecord = {
  id: string;
  animalId: string;
  medicineName: string;
  category: MedicineCategory;
  dosage: string | null;
  dosageUnit: string | null;
  givenOn: string;
  nextDueDate: string | null;
  costKsh: number | null;
  administeredBy: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type NewMilkRecordInput = {
  amount_litres: number;
  recorded_on: string;
  session: MilkSession;
  notes: string | null;
};

export type NewMedicineRecordInput = {
  medicine_name: string;
  category: MedicineCategory;
  dosage: string | null;
  dosage_unit: string | null;
  given_on: string;
  next_due_date: string | null;
  cost_ksh: number | null;
  administered_by: string | null;
  notes: string | null;
};

export class RecordDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RecordDataError';
  }
}

export const MILK_SESSIONS: MilkSession[] = ['Morning', 'Evening', 'Any'];
export const MEDICINE_CATEGORIES: MedicineCategory[] = [
  'Antibiotic',
  'Dewormer',
  'Vaccine',
  'Vitamin/Supplement',
  'Pain reliever',
  'Other',
];

function recordServiceMessage(error: { code?: string } | null | undefined) {
  if (error?.code === 'PGRST205' || error?.code === '42P01') {
    return 'Record keeping is not configured yet. Apply the milk and medicine migration in Supabase, then try again.';
  }
  if (error?.code === '42501') return 'You do not have permission to save this record.';
  return 'We could not save that record. Check the required fields and try again.';
}

type MilkRow = NewMilkRecordInput & {
  id: string;
  animal_id: string;
  created_at: string;
  updated_at: string;
};

type MedicineRow = NewMedicineRecordInput & {
  id: string;
  animal_id: string;
  created_at: string;
  updated_at: string;
};

function toMilkRecord(row: MilkRow): MilkRecord {
  return {
    id: row.id,
    animalId: row.animal_id,
    amountLitres: Number(row.amount_litres),
    recordedOn: row.recorded_on,
    session: row.session,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toMedicineRecord(row: MedicineRow): MedicineRecord {
  return {
    id: row.id,
    animalId: row.animal_id,
    medicineName: row.medicine_name,
    category: row.category,
    dosage: row.dosage,
    dosageUnit: row.dosage_unit,
    givenOn: row.given_on,
    nextDueDate: row.next_due_date,
    costKsh: row.cost_ksh === null ? null : Number(row.cost_ksh),
    administeredBy: row.administered_by,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function loadMyMilkRecords(): Promise<MilkRecord[]> {
  const supabase = createClient();
  if (!supabase) throw new RecordDataError('Supabase is not configured.');

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new RecordDataError('Your session expired. Sign in again to view records.');

  const { data, error } = await supabase
    .from('milk_records')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw new RecordDataError(recordServiceMessage(error));
  return (data as unknown as MilkRow[]).map(toMilkRecord);
}

export async function createMyMilkRecord(animalId: string, input: NewMilkRecordInput): Promise<MilkRecord> {
  const supabase = createClient();
  if (!supabase) throw new RecordDataError('Supabase is not configured.');

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new RecordDataError('Your session expired. Sign in again before logging milk.');

  const { data, error } = await supabase
    .from('milk_records')
    .insert({ ...input, owner_id: user.id, animal_id: animalId })
    .select('*')
    .single();

  if (error) throw new RecordDataError(recordServiceMessage(error));
  return toMilkRecord(data as unknown as MilkRow);
}

export async function loadMyMedicineRecords(): Promise<MedicineRecord[]> {
  const supabase = createClient();
  if (!supabase) throw new RecordDataError('Supabase is not configured.');

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new RecordDataError('Your session expired. Sign in again to view records.');

  const { data, error } = await supabase
    .from('medicine_records')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw new RecordDataError(recordServiceMessage(error));
  return (data as unknown as MedicineRow[]).map(toMedicineRecord);
}

export async function createMyMedicineRecord(animalId: string, input: NewMedicineRecordInput): Promise<MedicineRecord> {
  const supabase = createClient();
  if (!supabase) throw new RecordDataError('Supabase is not configured.');

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new RecordDataError('Your session expired. Sign in again before logging medicine.');

  const { data, error } = await supabase
    .from('medicine_records')
    .insert({ ...input, owner_id: user.id, animal_id: animalId })
    .select('*')
    .single();

  if (error) throw new RecordDataError(recordServiceMessage(error));
  return toMedicineRecord(data as unknown as MedicineRow);
}