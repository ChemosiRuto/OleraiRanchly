'use client';

import { type FormEvent, useEffect, useState } from 'react';
import { Camera, CheckCircle2, FileImage, Trash2, X } from 'lucide-react';
import {
  type Animal,
  AnimalDataError,
  createMyAnimal,
  getAnimalPhotoSignedUrl,
  type NewAnimalInput,
  updateMyAnimal,
} from '@/lib/animals';

type AcquisitionMethod = NewAnimalInput['acquisition_method'];
type AnimalType = NewAnimalInput['animal_type'];
type Sex = NewAnimalInput['sex'];

type AddAnimalDialogProps = {
  animalToEdit?: Animal | null;
  onClose: () => void;
  onSaved: (animal: Animal, isEdit: boolean) => void;
};

const acquisitionOptions: { value: AcquisitionMethod; description: string }[] = [
  { value: 'Born on Farm', description: 'Bred and born in your herd' },
  { value: 'Bought', description: 'Purchased from a seller' },
  { value: 'Consigned/Received', description: 'Temporarily in your care' },
];

const animalTypes: AnimalType[] = ['Cattle', 'Goat', 'Sheep', 'Pig', 'Other Livestock'];
const dateToday = new Date().toISOString().slice(0, 10);

function optionalText(value: FormDataEntryValue | null) {
  const text = String(value ?? '').trim();
  return text || null;
}

function optionalNumber(value: FormDataEntryValue | null) {
  const text = String(value ?? '').trim();
  if (!text) return null;
  const number = Number(text);
  return Number.isFinite(number) ? number : null;
}

export default function AddAnimalDialog({ animalToEdit, onClose, onSaved }: AddAnimalDialogProps) {
  const isEdit = Boolean(animalToEdit);
  const [animalType, setAnimalType] = useState<AnimalType>(animalToEdit?.animalType || 'Cattle');
  const [sex, setSex] = useState<Sex>(animalToEdit?.sex || 'Female');
  const [acquisition, setAcquisition] = useState<AcquisitionMethod>(animalToEdit?.acquisitionMethod || 'Born on Farm');
  const [photoName, setPhotoName] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null);
  const [removeExistingPhoto, setRemoveExistingPhoto] = useState(false);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Load signed URL for existing photo if in edit mode
  useEffect(() => {
    let active = true;
    if (animalToEdit?.photoPath) {
      void getAnimalPhotoSignedUrl(animalToEdit.photoPath).then((url) => {
        if (active && url) setExistingPhotoUrl(url);
      });
    }
    return () => {
      active = false;
    };
  }, [animalToEdit?.photoPath]);

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPhotoName(file.name);
      setRemoveExistingPhoto(false);
      const objectUrl = URL.createObjectURL(file);
      setPhotoPreview(objectUrl);
    } else {
      setPhotoName('');
      setPhotoPreview(null);
    }
  };

  const handleClearPhoto = () => {
    setPhotoName('');
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
      setPhotoPreview(null);
    }
    if (existingPhotoUrl) {
      setRemoveExistingPhoto(true);
      setExistingPhotoUrl(null);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSaving) return;

    const form = event.currentTarget;
    const formData = new FormData(form);
    const photoValue = formData.get('animal_photo');
    const photo = photoValue instanceof File && photoValue.size > 0 ? photoValue : null;
    const ownershipType: NewAnimalInput['ownership_type'] =
      acquisition === 'Consigned/Received' ? 'Consigned/Received' : 'Owned';

    // Format fields strictly according to database constraints
    const input: NewAnimalInput = {
      tag_number: String(formData.get('tag_number') ?? '').trim(),
      name: String(formData.get('name') ?? '').trim(),
      animal_type: animalType,
      other_animal_type: animalType === 'Other Livestock' ? optionalText(formData.get('other_animal_type')) : null,
      breed: String(formData.get('breed') ?? '').trim(),
      sex,
      color_markings: optionalText(formData.get('color_markings')),
      purpose: optionalText(formData.get('purpose')) as NewAnimalInput['purpose'],
      acquisition_method: acquisition,
      date_of_birth: acquisition === 'Born on Farm' ? optionalText(formData.get('date_of_birth')) : null,
      mother_dam_tag: acquisition === 'Born on Farm' ? optionalText(formData.get('mother_dam_tag')) : null,
      father_sire_tag: acquisition === 'Born on Farm' ? optionalText(formData.get('father_sire_tag')) : null,
      birth_type: acquisition === 'Born on Farm' ? (String(formData.get('birth_type') ?? '') as NewAnimalInput['birth_type']) : null,
      birth_weight_kg: acquisition === 'Born on Farm' ? optionalNumber(formData.get('birth_weight_kg')) : null,
      purchase_date: acquisition === 'Bought' ? optionalText(formData.get('purchase_date')) : null,
      purchase_price_ksh: acquisition === 'Bought' ? optionalNumber(formData.get('purchase_price_ksh')) : null,
      age_at_purchase: acquisition === 'Bought' ? optionalText(formData.get('age_at_purchase')) : null,
      seller_name: acquisition === 'Bought' ? optionalText(formData.get('seller_name')) : null,
      seller_phone: acquisition === 'Bought' ? optionalText(formData.get('seller_phone')) : null,
      purchase_location: acquisition === 'Bought' ? optionalText(formData.get('purchase_location')) : null,
      consignment_owner_name: acquisition === 'Consigned/Received' ? optionalText(formData.get('consignment_owner_name')) : null,
      consignment_owner_phone: acquisition === 'Consigned/Received' ? optionalText(formData.get('consignment_owner_phone')) : null,
      date_received: acquisition === 'Consigned/Received' ? optionalText(formData.get('date_received')) : null,
      expected_return_date: acquisition === 'Consigned/Received' ? optionalText(formData.get('expected_return_date')) : null,
      consignment_reason: acquisition === 'Consigned/Received' ? optionalText(formData.get('consignment_reason')) : null,
      breeding_status: sex === 'Female' ? (String(formData.get('breeding_status') ?? 'Unknown') as NewAnimalInput['breeding_status']) : null,
      first_breeding_date: sex === 'Female' ? optionalText(formData.get('first_breeding_date')) : null,
      last_mating_date: sex === 'Female' ? optionalText(formData.get('last_mating_date')) : null,
      expected_delivery_date: sex === 'Female' ? optionalText(formData.get('expected_delivery_date')) : null,
      breeding_notes: sex === 'Female' ? optionalText(formData.get('breeding_notes')) : null,
      health_status: String(formData.get('health_status') ?? 'Unknown') as NewAnimalInput['health_status'],
      vaccination_date: optionalText(formData.get('vaccination_date')),
      next_vaccination_date: optionalText(formData.get('next_vaccination_date')),
      deworming_date: optionalText(formData.get('deworming_date')),
      next_deworming_date: optionalText(formData.get('next_deworming_date')),
      health_notes: optionalText(formData.get('health_notes')),
      ownership_type: ownershipType,
      animal_status: String(formData.get('animal_status') ?? 'Active') as NewAnimalInput['animal_status'],
      additional_notes: optionalText(formData.get('additional_notes')),
    };

    setError('');
    setIsSaving(true);
    try {
      if (isEdit && animalToEdit) {
        const updated = await updateMyAnimal(animalToEdit.id, input, photo, removeExistingPhoto);
        onSaved(updated, true);
      } else {
        const created = await createMyAnimal(input, photo);
        onSaved(created, false);
      }
    } catch (cause) {
      setError(
        cause instanceof AnimalDataError
          ? cause.message
          : isEdit
          ? 'We could not update this animal. Check the details and try again.'
          : 'We could not add this animal. Check the details and try again.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] grid place-items-center overflow-y-auto bg-black/80 p-3 backdrop-blur-sm sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSaving) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="animal-modal-title"
        className="my-auto w-full max-w-3xl rounded-lg border border-[#2A4033] bg-[#101C18] shadow-2xl"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 rounded-t-lg border-b border-[#24372D] bg-[#101C18]/95 px-5 py-4 backdrop-blur sm:px-7">
          <div>
            <p className="text-[10px] font-bold tracking-[0.18em] text-[#34D399]">
              {isEdit ? 'HERD RECORDS / UPDATE' : 'FARM / HERD RECORDS'}
            </p>
            <h2 id="animal-modal-title" className="mt-1 text-xl font-bold text-[#F0F5F2]">
              {isEdit ? `Edit animal: ${animalToEdit?.name || animalToEdit?.tagNumber}` : 'Add animal'}
            </h2>
            <p className="mt-1 text-xs text-[#829189]">
              {isEdit
                ? 'Update animal details saved under your farm account.'
                : 'Register a complete animal profile under your account.'}
            </p>
          </div>
          <button
            type="button"
            disabled={isSaving}
            onClick={onClose}
            aria-label="Close form"
            className="flex size-9 shrink-0 items-center justify-center rounded-md border border-[#2A4033] text-[#9AA9A0] hover:text-white disabled:opacity-50"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="mx-5 mt-4 rounded-md border border-[#FB7185]/30 bg-[#FB7185]/10 p-3 text-xs text-[#FDA4AF] sm:mx-7"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 px-5 py-5 sm:px-7 sm:py-6">
          {/* 01: Animal Identity */}
          <FormSection number="01" title="Animal identity">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="Animal name"
                name="name"
                required
                defaultValue={animalToEdit?.name}
                placeholder="e.g. Bella"
              />
              <FormField
                label="Tag number"
                name="tag_number"
                required
                maxLength={40}
                defaultValue={animalToEdit?.tagNumber}
                placeholder="e.g. C-021"
                hint="Must be unique within your account."
              />
              <FormSelect
                label="Animal type"
                name="animal_type"
                value={animalType}
                onChange={(value) => setAnimalType(value as AnimalType)}
                options={animalTypes}
                required
              />
              {animalType === 'Other Livestock' && (
                <FormField
                  label="Specify animal type"
                  name="other_animal_type"
                  required
                  maxLength={80}
                  defaultValue={animalToEdit?.otherAnimalType || ''}
                  placeholder="e.g. Camel, Rabbit, Donkey"
                />
              )}
              <FormField
                label="Breed"
                name="breed"
                required
                maxLength={120}
                defaultValue={animalToEdit?.breed}
                placeholder="e.g. Friesian, Ayrshire, Boer"
              />
              <FormSelect
                label="Sex"
                name="sex"
                value={sex}
                onChange={(value) => setSex(value as Sex)}
                options={['Female', 'Male', 'Unknown']}
                required
              />
              <FormField
                label="Color / markings"
                name="color_markings"
                defaultValue={animalToEdit?.colorMarkings || animalToEdit?.color || ''}
                placeholder="e.g. Black and white patches"
              />
              <FormSelect
                label="Purpose (optional)"
                name="purpose"
                defaultValue={animalToEdit?.purpose || 'Dairy'}
                options={['Dairy', 'Meat', 'Wool', 'Dual-purpose', 'Pork', 'Other']}
              />
            </div>

            {/* Photo upload / preview */}
            <div className="mt-4 space-y-2">
              {(photoPreview || existingPhotoUrl) && (
                <div className="flex items-center gap-3 rounded-md border border-[#2A4033] bg-[#0B1511] p-3">
                  <div className="relative size-16 shrink-0 overflow-hidden rounded border border-[#34D399]/30 bg-black">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photoPreview || existingPhotoUrl || ''}
                      alt="Preview"
                      className="size-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-[#E7EFEA]">
                      {photoName || 'Current animal photo'}
                    </p>
                    <p className="mt-0.5 text-[10px] text-[#829189]">
                      {photoPreview ? 'Ready to upload on save' : 'Saved in cloud storage'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearPhoto}
                    className="flex size-8 shrink-0 items-center justify-center rounded border border-[#FB7185]/30 text-[#FDA4AF] hover:bg-[#FB7185]/10"
                    title="Remove photo"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              )}

              <label className="flex cursor-pointer items-center gap-3 rounded-md border border-dashed border-[#385344] bg-[#0B1511] p-4 transition-colors hover:border-[#34D399]">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-[#34D399]/10 text-[#6EE7B7]">
                  <Camera aria-hidden="true" className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-semibold text-[#E7EFEA]">
                    {existingPhotoUrl || photoPreview ? 'Change animal photo' : 'Animal photo'}{' '}
                    <span className="font-normal text-[#829189]">· optional</span>
                  </span>
                  <span className="mt-1 block truncate text-[10px] text-[#829189]">
                    {photoName || 'JPG, PNG, or WebP · up to 5 MB'}
                  </span>
                </span>
                <FileImage aria-hidden="true" className="size-4 shrink-0 text-[#829189]" />
                <input
                  type="file"
                  name="animal_photo"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={handlePhotoChange}
                />
              </label>
            </div>
          </FormSection>

          {/* 02: Acquisition */}
          <FormSection number="02" title="Acquisition">
            <div className="grid gap-2 sm:grid-cols-3" role="group" aria-label="Acquisition method">
              {acquisitionOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={acquisition === option.value}
                  onClick={() => setAcquisition(option.value)}
                  className={`min-h-[72px] rounded-md border p-3 text-left transition-colors ${
                    acquisition === option.value
                      ? 'border-[#34D399]/60 bg-[#34D399]/10 ring-1 ring-[#34D399]/30'
                      : 'border-[#2A4033] bg-[#0B1511] hover:border-[#45604F]'
                  }`}
                >
                  <span className="block text-xs font-bold text-[#E7EFEA]">{option.value}</span>
                  <span className="mt-1 block text-[10px] leading-relaxed text-[#829189]">{option.description}</span>
                </button>
              ))}
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {acquisition === 'Born on Farm' && (
                <>
                  <FormField
                    label="Date of birth"
                    name="date_of_birth"
                    type="date"
                    required
                    max={dateToday}
                    defaultValue={animalToEdit?.dateOfBirth || ''}
                  />
                  <FormSelect
                    label="Birth type"
                    name="birth_type"
                    defaultValue={animalToEdit?.birthType || 'Single'}
                    options={['Single', 'Twin', 'Triplet', 'Multiple', 'Other']}
                    required
                  />
                  <FormField
                    label="Birth weight (kg)"
                    name="birth_weight_kg"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    defaultValue={animalToEdit?.birthWeightKg !== null ? String(animalToEdit?.birthWeightKg ?? '') : ''}
                    placeholder="e.g. 32.5"
                  />
                  <FormField
                    label="Mother / dam tag"
                    name="mother_dam_tag"
                    defaultValue={animalToEdit?.motherDamTag || ''}
                    placeholder="Optional tag number"
                  />
                  <FormField
                    label="Father / sire tag"
                    name="father_sire_tag"
                    defaultValue={animalToEdit?.fatherSireTag || ''}
                    placeholder="Optional tag number"
                  />
                </>
              )}

              {acquisition === 'Bought' && (
                <>
                  <FormField
                    label="Purchase date"
                    name="purchase_date"
                    type="date"
                    required
                    max={dateToday}
                    defaultValue={animalToEdit?.purchaseDate || ''}
                  />
                  <FormField
                    label="Purchase price (KSh)"
                    name="purchase_price_ksh"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    defaultValue={animalToEdit?.purchasePriceKsh !== null ? String(animalToEdit?.purchasePriceKsh ?? '') : ''}
                    placeholder="e.g. 85000"
                  />
                  <FormField
                    label="Age at purchase"
                    name="age_at_purchase"
                    defaultValue={animalToEdit?.ageAtPurchase || ''}
                    placeholder="e.g. 18 months"
                  />
                  <FormField
                    label="Seller name"
                    name="seller_name"
                    required
                    defaultValue={animalToEdit?.sellerName || ''}
                    placeholder="Seller's full name"
                  />
                  <FormField
                    label="Seller phone"
                    name="seller_phone"
                    type="tel"
                    required
                    defaultValue={animalToEdit?.sellerPhone || ''}
                    placeholder="+254 7XX XXX XXX"
                  />
                  <FormField
                    label="Purchase location"
                    name="purchase_location"
                    required
                    defaultValue={animalToEdit?.purchaseLocation || ''}
                    placeholder="Town / county"
                  />
                </>
              )}

              {acquisition === 'Consigned/Received' && (
                <>
                  <FormField
                    label="Owner name"
                    name="consignment_owner_name"
                    required
                    defaultValue={animalToEdit?.consignmentOwnerName || ''}
                    placeholder="Owner's full name"
                  />
                  <FormField
                    label="Owner phone"
                    name="consignment_owner_phone"
                    type="tel"
                    required
                    defaultValue={animalToEdit?.consignmentOwnerPhone || ''}
                    placeholder="+254 7XX XXX XXX"
                  />
                  <FormField
                    label="Date received"
                    name="date_received"
                    type="date"
                    required
                    max={dateToday}
                    defaultValue={animalToEdit?.dateReceived || ''}
                  />
                  <FormField
                    label="Expected return date"
                    name="expected_return_date"
                    type="date"
                    min={dateToday}
                    defaultValue={animalToEdit?.expectedReturnDate || ''}
                  />
                  <FormField
                    label="Reason for consignment"
                    name="consignment_reason"
                    required
                    defaultValue={animalToEdit?.consignmentReason || ''}
                    placeholder="e.g. Temporary feeding & care"
                  />
                </>
              )}
            </div>

            <div className="mt-4 rounded-md border border-[#2A4033] bg-[#0B1511] px-3 py-2.5 text-xs text-[#AEBBB3]">
              Ownership type{' '}
              <span className="float-right font-semibold text-[#E7EFEA]">
                {acquisition === 'Consigned/Received' ? 'Consigned / received' : 'Owned'}
              </span>
            </div>
          </FormSection>

          {/* 03: Breeding (Conditional: Female only) */}
          {sex === 'Female' && (
            <FormSection number="03" title="Breeding">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormSelect
                  label="Breeding status"
                  name="breeding_status"
                  defaultValue={animalToEdit?.breedingStatus || 'Unknown'}
                  options={['Unknown', 'Not breeding', 'Open', 'Bred', 'Pregnant', 'Lactating', 'Dry']}
                />
                <FormField
                  label="First breeding date"
                  name="first_breeding_date"
                  type="date"
                  defaultValue={animalToEdit?.firstBreedingDate || ''}
                />
                <FormField
                  label="Last mating / insemination date"
                  name="last_mating_date"
                  type="date"
                  defaultValue={animalToEdit?.lastMatingDate || ''}
                />
                <FormField
                  label="Expected delivery date"
                  name="expected_delivery_date"
                  type="date"
                  defaultValue={animalToEdit?.expectedDeliveryDate || ''}
                />
                <FormField
                  label="Breeding notes"
                  name="breeding_notes"
                  defaultValue={animalToEdit?.breedingNotes || ''}
                  placeholder="e.g. Artificial insemination with Holstein semen"
                />
              </div>
            </FormSection>
          )}

          {/* 04: Health */}
          <FormSection number={sex === 'Female' ? '04' : '03'} title="Health">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormSelect
                label="Health status"
                name="health_status"
                defaultValue={animalToEdit?.healthStatus || 'Healthy'}
                options={['Healthy', 'Needs attention', 'Under treatment', 'Unknown']}
                required
              />
              <FormField
                label="Last vaccination date"
                name="vaccination_date"
                type="date"
                defaultValue={animalToEdit?.vaccinationDate || ''}
              />
              <FormField
                label="Next vaccination date"
                name="next_vaccination_date"
                type="date"
                defaultValue={animalToEdit?.nextVaccinationDate || ''}
              />
              <FormField
                label="Last deworming date"
                name="deworming_date"
                type="date"
                defaultValue={animalToEdit?.dewormingDate || ''}
              />
              <FormField
                label="Next deworming date"
                name="next_deworming_date"
                type="date"
                defaultValue={animalToEdit?.nextDewormingDate || ''}
              />
              <FormField
                label="Health notes"
                name="health_notes"
                defaultValue={animalToEdit?.healthNotes || ''}
                placeholder="e.g. Anthrax vaccination done, routine booster in 6 mos"
              />
            </div>
          </FormSection>

          {/* 05: Other details */}
          <FormSection number={sex === 'Female' ? '05' : '04'} title="Other details">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormSelect
                label="Animal status"
                name="animal_status"
                defaultValue={animalToEdit?.animalStatus || 'Active'}
                options={['Active', 'Quarantined', 'Sold', 'Deceased', 'Transferred']}
                required
              />
              <FormField
                label="Additional notes"
                name="additional_notes"
                defaultValue={animalToEdit?.additionalNotes || ''}
                placeholder="e.g. Docile temperament, good milk producer"
              />
            </div>
          </FormSection>

          {/* Actions */}
          <div className="sticky bottom-0 -mx-5 flex flex-col-reverse gap-2 border-t border-[#24372D] bg-[#101C18]/95 px-5 py-3 backdrop-blur sm:-mx-7 sm:flex-row sm:justify-end sm:px-7">
            <button
              type="button"
              disabled={isSaving}
              onClick={onClose}
              className="min-h-10 rounded-md border border-[#2A4033] px-4 text-xs font-semibold text-[#C4D0C9] transition-colors hover:border-[#42584A] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[#34D399] px-5 text-xs font-bold text-[#07150F] transition-colors hover:bg-[#6EE7B7] disabled:cursor-wait disabled:opacity-60"
            >
              {isSaving
                ? isEdit
                  ? 'Updating animal…'
                  : 'Saving animal…'
                : isEdit
                ? 'Update animal'
                : 'Save animal'}{' '}
              {!isSaving && <CheckCircle2 aria-hidden="true" className="size-4" />}
            </button>
          </div>
          <p className="text-center text-[10px] leading-relaxed text-[#829189]">
            Photo uploads and animal records belong securely to your signed-in farm account.
          </p>
        </form>
      </section>
    </div>
  );
}

function FormSection({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-[#24372D] pt-5">
      <div className="mb-4 flex items-center gap-3">
        <span className="font-mono text-[10px] font-semibold text-[#6EE7B7]">{number}</span>
        <h3 className="text-sm font-bold text-[#E7EFEA]">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function FormField({
  label,
  name,
  type = 'text',
  placeholder,
  required = false,
  min,
  max,
  maxLength,
  step,
  hint,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  min?: string;
  max?: string;
  maxLength?: number;
  step?: string;
  hint?: string;
  defaultValue?: string;
}) {
  return (
    <label className="block min-w-0 text-xs font-semibold text-[#C4D0C9]">
      {label}
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        min={min}
        max={max}
        maxLength={maxLength}
        step={step}
        className="mt-2 h-10 w-full min-w-0 rounded-md border border-[#2A4033] bg-[#0B1511] px-3 text-sm font-normal text-[#E7EFEA] outline-none placeholder:text-[#596A60] focus:border-[#34D399] focus:ring-2 focus:ring-[#34D399]/10"
      />
      {hint && <span className="mt-1 block text-[10px] font-normal text-[#829189]">{hint}</span>}
    </label>
  );
}

function FormSelect({
  label,
  name,
  options,
  required = false,
  value,
  defaultValue,
  onChange,
}: {
  label: string;
  name: string;
  options: string[];
  required?: boolean;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <label className="block min-w-0 text-xs font-semibold text-[#C4D0C9]">
      {label}
      <select
        name={name}
        required={required}
        value={value}
        defaultValue={defaultValue}
        onChange={(event) => onChange?.(event.target.value)}
        className="mt-2 h-10 w-full min-w-0 rounded-md border border-[#2A4033] bg-[#0B1511] px-3 text-sm font-normal text-[#E7EFEA] outline-none focus:border-[#34D399]"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
