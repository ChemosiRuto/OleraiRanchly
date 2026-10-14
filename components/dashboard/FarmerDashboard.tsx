'use client';

import { type FormEvent, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Baby,
  Beaker,
  Beef,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  CircleHelp,
  CloudSun,
  Coins,
  CreditCard,
  Download,
  Droplets,
  Egg,
  Filter,
  Handshake,
  HeartPulse,
  Leaf,
  LogOut,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  MessageSquareText,
  Milk,
  Package,
  Pencil,
  Phone,
  Pill,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Sprout,
  Stethoscope,
  Syringe,
  Trash2,
  TrendingUp,
  Truck,
  UserRound,
  Users,
  Wheat,
  Wrench,
  X,
  type LucideIcon,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import AddAnimalDialog from '@/components/dashboard/AddAnimalDialog';
import {
  type Animal,
  AnimalDataError,
  type AnimalStatus,
  deleteMyAnimal,
  getAnimalPhotoSignedUrl,
  loadMyAnimals,
} from '@/lib/animals';
import {
  type MedicineCategory,
  type MedicineRecord,
  type MilkRecord,
  type MilkSession,
  RecordDataError,
  createMyMedicineRecord,
  createMyMilkRecord,
  loadMyMedicineRecords,
  loadMyMilkRecords,
  MEDICINE_CATEGORIES,
  MILK_SESSIONS,
} from '@/lib/records';
import {
  type ListingCategory,
  type MarketplaceListing,
  MarketplaceDataError,
  createMarketplaceListing,
  deleteMarketplaceListing,
  KENYA_COUNTIES,
  LISTING_CATEGORIES,
  loadMarketplaceListings,
  loadMyMarketplaceListings,
} from '@/lib/marketplace';
import logo from '../../images/logoF.png';

type DashboardSection = 'overview' | 'livestock' | 'marketplace' | 'vet' | 'finance' | 'analytics' | 'community' | 'profile' | 'settings';
type ListingSort = 'newest' | 'price-asc' | 'price-desc';
type DialogState =
  | { kind: 'animal-details'; animalId: string }
  | { kind: 'delete-confirm'; animal: Animal }
  | { kind: 'add-milk'; animalId?: string }
  | { kind: 'add-medicine'; animalId?: string }
  | { kind: 'post-listing' }
  | { kind: 'listing-details'; listingId: string }
  | { kind: 'book-vet'; provider: string }
  | null;

type FarmerDashboardProps = { email: string };

const navigation: { group: string; items: { id: DashboardSection; label: string; icon: LucideIcon }[] }[] = [
  { group: 'Farm', items: [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'livestock', label: 'My livestock', icon: Beef },
    { id: 'marketplace', label: 'Marketplace', icon: ShoppingBag },
  ] },
  { group: 'Services', items: [
    { id: 'vet', label: 'Vet & advisory', icon: Stethoscope },
    { id: 'finance', label: 'Finance & cover', icon: CreditCard },
    { id: 'analytics', label: 'Farm insights', icon: TrendingUp },
    { id: 'community', label: 'Community', icon: Users },
  ] },
  { group: 'Account', items: [
    { id: 'profile', label: 'My profile', icon: UserRound },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] },
];

const providers = [
  { name: 'Dr. Samuel Otieno', location: 'Bomet · 2.1 km', rating: '4.9', specialty: 'Large animal practice' },
  { name: 'Dr. Mary Wanjiku', location: 'Kericho · 12 km', rating: '4.8', specialty: 'Dairy herd health' },
  { name: 'Dr. Grace Chebet', location: 'Bomet · 4.3 km', rating: '4.9', specialty: 'Livestock and preventive care' },
];

const marketTabs = ['All', ...LISTING_CATEGORIES];
const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function lastSevenDays(): { iso: string; label: string; isToday: boolean }[] {
  const days: { iso: string; label: string; isToday: boolean }[] = [];
  for (let offset = 6; offset >= 0; offset--) {
    const date = new Date();
    date.setDate(date.getDate() - offset);
    days.push({
      iso: date.toISOString().split('T')[0],
      label: WEEKDAY_SHORT[date.getDay()],
      isToday: offset === 0,
    });
  }
  return days;
}

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

type MilkBucket = { label: string; iso: string; value: number; current: boolean };

function milkBucketLabel(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function buildMilkBuckets(period: 'daily' | 'weekly' | 'yearly', milkByDate: Map<string, number>, now: Date): MilkBucket[] {
  if (period === 'daily') {
    const buckets: MilkBucket[] = [];
    for (let offset = 13; offset >= 0; offset--) {
      const date = new Date(now);
      date.setDate(date.getDate() - offset);
      const iso = date.toISOString().split('T')[0];
      buckets.push({ label: String(date.getDate()), iso, value: milkByDate.get(iso) ?? 0, current: offset === 0 });
    }
    return buckets;
  }
  if (period === 'weekly') {
    const buckets: MilkBucket[] = [];
    for (let offset = 8; offset >= 1; offset--) {
      const end = new Date(now);
      end.setDate(end.getDate() - (offset - 1));
      const start = new Date(end);
      start.setDate(start.getDate() - 6);
      const endIso = end.toISOString().split('T')[0];
      const startIso = start.toISOString().split('T')[0];
      let value = 0;
      for (const [iso, litres] of milkByDate) if (iso >= startIso && iso <= endIso) value += litres;
      buckets.push({ label: milkBucketLabel(startIso), iso: endIso, value, current: offset === 1 });
    }
    return buckets;
  }
  const buckets: MilkBucket[] = [];
  const cursor = new Date(now.getFullYear(), now.getMonth(), 1);
  for (let offset = 11; offset >= 0; offset--) {
    const date = new Date(cursor.getFullYear(), cursor.getMonth() - offset, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    let value = 0;
    for (const [iso, litres] of milkByDate) if (iso.startsWith(key)) value += litres;
    buckets.push({ label: MONTH_SHORT[date.getMonth()], iso: key, value, current: offset === 0 });
  }
  return buckets;
}

function downloadCsv(filename: string, header: string[], rows: string[][]) {
  const csv = [header.join(','), ...rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function MilkAreaChart({ buckets }: { buckets: MilkBucket[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const width = 720;
  const height = 205;
  const padX = 30;
  const padY = 20;
  const n = buckets.length;
  const maxValue = Math.max(...buckets.map((bucket) => bucket.value), 1);
  const ceiling = Math.max(maxValue * 1.15, 1);
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;
  const stepX = n > 1 ? innerW / (n - 1) : 0;

  const pts = buckets.map((bucket, i) => ({
    x: padX + i * stepX,
    y: padY + innerH - (bucket.value / ceiling) * innerH,
  }));

  const linePath = pts.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
    const p0 = pts[Math.max(0, i - 2)];
    const p1 = pts[Math.max(0, i - 1)];
    const p3 = pts[Math.min(n - 1, i + 1)];
    const c1x = p1.x + (p.x - p0.x) / 6;
    const c1y = p1.y + (p.y - p0.y) / 6;
    const c2x = p.x - (p3.x - p1.x) / 6;
    const c2y = p.y - (p3.y - p1.y) / 6;
    return `${acc} C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  }, '');

  const areaPath = linePath && pts[0] ? `${linePath} L ${pts[n - 1].x.toFixed(1)} ${padY + innerH} L ${pts[0].x.toFixed(1)} ${padY + innerH} Z` : '';

  const tooltipLabel = (bucket: MilkBucket) => (/^\d{4}-\d{2}$/.test(bucket.iso) ? `${MONTH_SHORT[Number(bucket.iso.split('-')[1]) - 1]} ${bucket.iso.split('-')[0]}` : milkBucketLabel(bucket.iso));

  const handleMove = (e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect || n === 0) return;
    const fraction = (e.clientX - rect.left) / rect.width;
    setHover(Math.max(0, Math.min(n - 1, Math.round(fraction * (n - 1)))));
  };

  const hoverBucket = hover !== null ? buckets[hover] : null;
  const lastPoint = pts[n - 1];
  const xLabelIdx = n > 1 ? [0, Math.floor(n / 2), n - 1] : [0];

  return (
    <div>
      <div ref={ref} className="relative select-none" onMouseMove={handleMove} onMouseLeave={() => setHover(null)}>
        <svg viewBox={`0 0 ${width} ${height}`} className="block w-full" role="img" aria-label="Milk production trend">
          <defs>
            <linearGradient id="milk-area-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34D399" stopOpacity="0.32" />
              <stop offset="60%" stopColor="#0EA5E9" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="milk-area-line" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#0EA5E9" />
              <stop offset="45%" stopColor="#34D399" />
              <stop offset="100%" stopColor="#6EE7B7" />
            </linearGradient>
          </defs>

          {[0.25, 0.5, 0.75, 1].map((t) => {
            const y = padY + innerH - t * innerH;
            return (
              <g key={t}>
                <line x1={padX} x2={width - padX} y1={y} y2={y} stroke="#24372D" strokeDasharray="3 5" strokeOpacity="0.55" />
                <text x={padX - 6} y={y + 3} textAnchor="end" fontSize="8" fill="#718178">
                  {ceiling * t >= 1000 ? `${(ceiling * t / 1000).toFixed(1)}k` : Math.round(ceiling * t)}
                </text>
              </g>
            );
          })}

          <line x1={padX} x2={width - padX} y1={padY + innerH} y2={padY + innerH} stroke="#2A4033" strokeWidth="1" />

          {linePath && <path d={linePath} fill="none" stroke="url(#milk-area-line)" strokeWidth="2.5" strokeLinecap="round" className="milk-area-line" />}
          {areaPath && <path d={areaPath} fill="url(#milk-area-fill)" />}

          {xLabelIdx.map((i) => (
            <text key={`${i}-${buckets[i]?.iso}`} x={pts[i]?.x ?? padX} y={height - 5} textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'} fontSize="8.5" fill={buckets[i]?.current ? '#6EE7B7' : '#829189'}>
              {buckets[i]?.label}
            </text>
          ))}

          {lastPoint && (
            <g>
              <circle cx={lastPoint.x} cy={lastPoint.y} r="3.5" fill="#6EE7B7" />
              <circle cx={lastPoint.x} cy={lastPoint.y} r="6.5" fill="none" stroke="#6EE7B7" strokeWidth="1.5" className="milk-pulse" />
            </g>
          )}

          {hover !== null && pts[hover] && (
            <g>
              <line x1={pts[hover].x} x2={pts[hover].x} y1={pts[hover].y} y2={padY + innerH} stroke="#34D399" strokeDasharray="2 3" strokeOpacity="0.8" />
              <circle cx={pts[hover].x} cy={pts[hover].y} r="4" fill="#0B1511" stroke="#6EE7B7" strokeWidth="2" />
            </g>
          )}
        </svg>

        {hoverBucket && hover !== null && pts[hover] && (
          <div
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-[calc(100%+10px)] whitespace-nowrap rounded-md border border-[#2A4033] bg-[#0B1511] px-2.5 py-1.5 text-center shadow-lg shadow-black/50"
            style={{ left: `${(pts[hover].x / width) * 100}%`, top: `${(pts[hover].y / height) * 100}%` }}
          >
            <p className="font-mono text-[11px] font-bold text-[#6EE7B7]">{hoverBucket.value.toLocaleString('en-KE')} L</p>
            <p className="text-[8.5px] text-[#829189]">{tooltipLabel(hoverBucket)}</p>
          </div>
        )}
      </div>
    </div>
  );
}

const dateToday = new Date().toISOString().split('T')[0];

function formatKsh(value: number) {
  return `KSh ${value.toLocaleString('en-KE')}`;
}

function listingCategoryIcon(category: ListingCategory) {
  switch (category) {
    case 'Livestock': return <Beef className="size-4" />;
    case 'Feed': return <Wheat className="size-4" />;
    case 'Supplements': return <Leaf className="size-4" />;
    case 'Equipment': return <Wrench className="size-4" />;
    case 'Medicines': return <Syringe className="size-4" />;
    case 'Produce': return <Egg className="size-4" />;
    case 'Transport': return <Truck className="size-4" />;
    case 'Services': return <Handshake className="size-4" />;
    default: return <Package className="size-4" />;
  }
}

function listingCategoryTone(category: ListingCategory) {
  switch (category) {
    case 'Livestock': return 'border-[#34D399]/25 bg-[#34D399]/10 text-[#6EE7B7]';
    case 'Feed': return 'border-[#FBBF24]/25 bg-[#FBBF24]/10 text-[#FCD34D]';
    case 'Supplements': return 'border-[#67E8F9]/25 bg-[#67E8F9]/10 text-[#67E8F9]';
    case 'Equipment': return 'border-[#C084FC]/25 bg-[#C084FC]/10 text-[#D8B4FE]';
    case 'Medicines': return 'border-[#FB7185]/25 bg-[#FB7185]/10 text-[#FDA4AF]';
    case 'Produce': return 'border-[#FCD34D]/25 bg-[#FCD34D]/10 text-[#FDE68A]';
    case 'Transport': return 'border-[#60A5FA]/25 bg-[#60A5FA]/10 text-[#93C5FD]';
    case 'Services': return 'border-[#F9A8D4]/25 bg-[#F9A8D4]/10 text-[#FBCFE8]';
    default: return 'border-[#9AA9A0]/25 bg-[#9AA9A0]/10 text-[#C4D0C9]';
  }
}

type ListingAttrField = { key: string; label: string; options?: string[]; placeholder?: string };

const LISTING_ATTR_FIELDS: Record<ListingCategory, ListingAttrField[]> = {
  Livestock: [
    { key: 'animal_type', label: 'Animal type', options: ['Cattle', 'Goat', 'Sheep', 'Pig', 'Poultry', 'Other livestock'] },
    { key: 'health_status', label: 'Health status', options: ['Healthy', 'Lactating', 'Pregnant', 'On heat', 'Brucellosis tested', 'Under treatment'] },
    { key: 'breed', label: 'Breed', placeholder: 'e.g. Friesian, Boer goat' },
    { key: 'age', label: 'Age', placeholder: 'e.g. 18 months' },
    { key: 'weight_kg', label: 'Weight (kg)', placeholder: 'e.g. 320' },
  ],
  Feed: [
    { key: 'feed_type', label: 'Feed type', options: ['Dairy meal', 'Calf pellets', 'Chick mash', 'Layers mash', 'Fodder', 'Hay', 'Silage', 'Mineral salt', 'Salt lick', 'Other'] },
    { key: 'brand', label: 'Brand / producer', placeholder: 'e.g. Unga, Bomet Feeds' },
    { key: 'packaging', label: 'Packaging', options: ['50 kg bag', '25 kg bag', '10 kg bag', 'Bale', 'Loose / per kg', 'Carton'] },
  ],
  Supplements: [
    { key: 'form', label: 'Form', options: ['Powder', 'Boluses', 'Mineral blocks', 'Liquid', 'Tablets', 'Injectable'] },
    { key: 'brand', label: 'Brand', placeholder: 'e.g. Maclick, Animax' },
    { key: 'target', label: 'Recommended for', options: ['Cattle', 'Goats', 'Sheep', 'Poultry', 'Pigs', 'All livestock'] },
  ],
  Equipment: [
    { key: 'equipment_type', label: 'Equipment type', options: ['Milking machine', 'Sprayer', 'Watering system', 'Hand tools', 'Incubator', 'Cattle crush', 'Tractor & implements', 'Other'] },
    { key: 'condition', label: 'Condition', options: ['New', 'Nearly new', 'Good used', 'For parts'] },
    { key: 'brand', label: 'Brand / model', placeholder: 'e.g. FarmTech 2000' },
  ],
  Medicines: [
    { key: 'product_type', label: 'Product type', options: ['Antibiotic', 'Dewormer', 'Vaccine', 'Vitamin / tonic', 'Antiseptic', 'Tick control', 'Fly control', 'Other'] },
    { key: 'form', label: 'Form', options: ['Injectable', 'Oral drench', 'Bolus', 'Powder', 'Spray', 'Pour-on'] },
    { key: 'package', label: 'Package size', placeholder: 'e.g. 100 ml vial, 250 g sachet' },
  ],
  Produce: [
    { key: 'produce_type', label: 'Produce type', options: ['Milk', 'Eggs', 'Honey', 'Meat', 'Manure', 'Vegetables', 'Fruits', 'Other'] },
    { key: 'quality', label: 'Quality', options: ['Fresh', 'Organic', 'Farm gate', 'Grade A', 'Grade B', 'Bulk'] },
    { key: 'quantity', label: 'Quantity on offer', placeholder: 'e.g. 20 litres, 30 crates, 2 tons' },
  ],
  Transport: [
    { key: 'vehicle', label: 'Vehicle type', options: ['Pickup truck', 'Lorry', 'Motorbike', 'Tractor & trailer', 'Van'] },
    { key: 'capacity', label: 'Load capacity', placeholder: 'e.g. 2 tons' },
    { key: 'route', label: 'Serving area', placeholder: 'e.g. Bomet to Nakuru corridor' },
  ],
  Services: [
    { key: 'service_type', label: 'Service', options: ['Veterinary', 'Artificial insemination', 'Farm labour', 'Fencing', 'Land preparation', 'Hoof care / hoof trimming', 'Shearing', 'Feed consultancy'] },
    { key: 'experience', label: 'Experience', placeholder: 'e.g. 5 years' },
    { key: 'availability', label: 'Availability', placeholder: 'e.g. Weekdays, weekends' },
  ],
  Other: [],
};

function listingSummary(listing: MarketplaceListing) {
  const attrs = listing.attributes ?? {};
  const parts = (() => {
    switch (listing.category) {
      case 'Livestock': return [attrs.health_status, attrs.breed, attrs.age];
      case 'Feed': return [attrs.feed_type, attrs.packaging];
      case 'Supplements': return [attrs.form, attrs.target];
      case 'Equipment': return [attrs.condition, attrs.brand];
      case 'Medicines': return [attrs.product_type, attrs.form, attrs.package];
      case 'Produce': return [attrs.produce_type, attrs.quality, attrs.quantity];
      case 'Transport': return [attrs.vehicle, attrs.capacity];
      case 'Services': return [attrs.service_type, attrs.experience];
      default: return [];
    }
  })();
  const text = parts.filter(Boolean).join(' · ');
  return text || (listing.description ? `${listing.description.split('.')[0]}.` : 'No extra details');
}

function getStatusStyle(status: AnimalStatus) {
  if (status === 'Healthy') return 'border-[#34D399]/25 bg-[#34D399]/10 text-[#6EE7B7]';
  if (status === 'Due soon') return 'border-[#FBBF24]/25 bg-[#FBBF24]/10 text-[#FCD34D]';
  return 'border-[#FB7185]/25 bg-[#FB7185]/10 text-[#FDA4AF]';
}

function SectionHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p className="mb-2 text-[10px] font-bold tracking-[0.18em] text-[#34D399]">{eyebrow}</p>
        <h1 className="text-2xl font-bold leading-tight text-[#F0F5F2] sm:text-3xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#9AA9A0]">{description}</p>}
      </div>
      {action}
    </div>
  );
}

function Panel({ title, icon: Icon, action, children, className = '' }: { title: string; icon: LucideIcon; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`min-w-0 rounded-lg border border-[#24372D] bg-[#111D18] p-4 sm:p-5 ${className}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex min-w-0 items-center gap-2 text-sm font-bold text-[#E7EFEA]"><Icon aria-hidden="true" className="size-4 shrink-0 text-[#34D399]" />{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

type ActivityEvent = { key: string; icon: LucideIcon; tone: string; title: string; time: string; badge?: string };

function formatRelativeTime(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  if (!Number.isFinite(diffMs) || diffMs < 0) return '';
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(timestamp).toLocaleDateString(
    'en-GB',
    diffDays >= 365 ? { day: 'numeric', month: 'short', year: 'numeric' } : { day: 'numeric', month: 'short' }
  );
}

function recentActivityEvents(
  animals: Animal[],
  milkRecords: MilkRecord[],
  medicineRecords: MedicineRecord[],
): ActivityEvent[] {
  const events: { at: number; event: ActivityEvent }[] = [];
  const animalNames = new Map(animals.map((animal) => [animal.id, animal]));

  for (const animal of animals) {
    const createdAt = new Date(animal.createdAt).getTime();
    const updatedAt = new Date(animal.updatedAt).getTime();
    const baseTime = Number.isFinite(createdAt) ? createdAt : 0;

    if (Number.isFinite(createdAt)) {
      events.push({
        at: createdAt,
        event: {
          key: `${animal.id}-added`,
          icon: Beef,
          tone: 'border-[#34D399]/25 bg-[#34D399]/10 text-[#6EE7B7]',
          title: `Added ${animal.name} (${animal.tagNumber}) to your herd`,
          time: formatRelativeTime(createdAt),
        },
      });
    }

    if (Number.isFinite(updatedAt) && updatedAt - baseTime > 60_000) {
      events.push({
        at: updatedAt,
        event: {
          key: `${animal.id}-updated`,
          icon: Activity,
          tone: 'border-[#67E8F9]/25 bg-[#67E8F9]/10 text-[#67E8F9]',
          title: `Updated ${animal.name} (${animal.tagNumber})`,
          time: formatRelativeTime(updatedAt),
        },
      });
    }
  }

  for (const record of milkRecords) {
    const at = new Date(record.createdAt).getTime();
    const animal = animalNames.get(record.animalId);
    events.push({
      at,
      event: {
        key: `milk-${record.id}`,
        icon: Milk,
        tone: 'border-[#22D3EE]/25 bg-[#22D3EE]/10 text-[#67E8F9]',
        title: `Logged ${record.amountLitres} L of milk from ${animal ? animal.name : 'an animal'}`,
        time: formatRelativeTime(at),
      },
    });
  }

  for (const record of medicineRecords) {
    const at = new Date(record.createdAt).getTime();
    const animal = animalNames.get(record.animalId);
    events.push({
      at,
      event: {
        key: `medicine-${record.id}`,
        icon: Pill,
        tone: 'border-[#FB7185]/25 bg-[#FB7185]/10 text-[#FDA4AF]',
        title: `Gave ${record.medicineName} to ${animal ? animal.name : 'an animal'}`,
        time: formatRelativeTime(at),
      },
    });
  }

  events.sort((a, b) => b.at - a.at);
  return events.slice(0, 5).map((entry) => entry.event);
}

function RecentActivity({
  animals,
  milkRecords,
  medicineRecords,
}: {
  animals: Animal[];
  milkRecords: MilkRecord[];
  medicineRecords: MedicineRecord[];
}) {
  const events = recentActivityEvents(animals, milkRecords, medicineRecords);

  if (events.length === 0) {
    return <EmptyState title="No activity yet" note="Add an animal, log milk, or record medicine and it will appear here." />;
  }

  return (
    <div className="divide-y divide-[#24372D]">
      {events.map((item) => (
        <div key={item.key} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
          <span className={`flex size-9 shrink-0 items-center justify-center rounded-md border ${item.tone}`}>
            <item.icon aria-hidden="true" className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-[#E7EFEA]">{item.title}</p>
            <p className="mt-0.5 text-[10px] text-[#829189]">{item.time}</p>
          </div>
          {item.badge && (
            <span className="shrink-0 rounded-full border border-[#24372D] bg-[#0B1511] px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-[#718178]">
              {item.badge}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

export default function FarmerDashboard({ email }: FarmerDashboardProps) {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<DashboardSection>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [animalsLoading, setAnimalsLoading] = useState(true);
  const [animalsError, setAnimalsError] = useState('');
  const [animalLoadAttempt, setAnimalLoadAttempt] = useState(0);
  const [addAnimalOpen, setAddAnimalOpen] = useState(false);
  const [animalToEdit, setAnimalToEdit] = useState<Animal | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [marketListings, setMarketListings] = useState<MarketplaceListing[]>([]);
  const [myListings, setMyListings] = useState<MarketplaceListing[]>([]);
  const [marketLoading, setMarketLoading] = useState(true);
  const [marketError, setMarketError] = useState('');
  const [marketLoadAttempt, setMarketLoadAttempt] = useState(0);
  const [marketSearch, setMarketSearch] = useState('');
  const [search, setSearch] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState('All species');
  const [statusFilter, setStatusFilter] = useState('All statuses');
  const [marketFilter, setMarketFilter] = useState('All');
  const [countyFilter, setCountyFilter] = useState('All counties');
  const [listingSort, setListingSort] = useState<ListingSort>('newest');
  const [dialog, setDialog] = useState<DialogState>(null);
  const [toast, setToast] = useState('');
  const [milkRecords, setMilkRecords] = useState<MilkRecord[]>([]);
  const [medicineRecords, setMedicineRecords] = useState<MedicineRecord[]>([]);
  const [recordsError, setRecordsError] = useState('');
  const [profileName, setProfileName] = useState(email.split('@')[0].replace(/[._-]/g, ' ') || 'Farmer');
  const [farmLocation, setFarmLocation] = useState('Kericho County');
  const [notifications, setNotifications] = useState({ vaccination: true, market: true, report: true, weather: false });
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [milkPeriod, setMilkPeriod] = useState<'daily' | 'weekly' | 'yearly'>('daily');
  const displayName = profileName.split(' ').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
  const milkToday = milkRecords
    .filter((record) => record.recordedOn === dateToday)
    .reduce((total, record) => total + record.amountLitres, 0);
  const healthyCount = animals.filter(animal => animal.status === 'Healthy').length;
  const attentionCount = animals.filter(animal => animal.status !== 'Healthy').length;
  const visibleAnimals = animals.filter(animal => {
    const matchesSearch = `${animal.tagNumber} ${animal.name} ${animal.species} ${animal.breed} ${animal.purpose}`.toLowerCase().includes(search.toLowerCase());
    const matchesSpecies = speciesFilter === 'All species' || animal.species === speciesFilter;
    const matchesStatus = statusFilter === 'All statuses' || animal.status === statusFilter;
    return matchesSearch && matchesSpecies && matchesStatus;
  });
  const visibleListings = marketListings
    .filter(listing => {
      const matchesType = marketFilter === 'All' || listing.category === marketFilter;
      const matchesCounty = countyFilter === 'All counties' || listing.locationCounty === countyFilter;
      const query = marketSearch.toLowerCase();
      const matchesText = `${listing.title} ${listing.description ?? ''} ${listing.locationCounty} ${listing.category}`.toLowerCase().includes(query);
      return matchesType && matchesCounty && matchesText;
    })
    .sort((a, b) => {
      if (listingSort === 'price-asc') return a.priceKsh - b.priceKsh;
      if (listingSort === 'price-desc') return b.priceKsh - a.priceKsh;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  const activeAnimal = dialog?.kind === 'animal-details'
    ? animals.find(animal => animal.id === dialog.animalId)
    : undefined;
  const activeListing = dialog?.kind === 'listing-details'
    ? [...marketListings, ...myListings].find(listing => listing.id === dialog.listingId)
    : undefined;

  useEffect(() => {
    let isActive = true;
    const loadAnimals = async () => {
      setAnimalsLoading(true);
      setAnimalsError('');
      try {
        const records = await loadMyAnimals();
        if (isActive) setAnimals(records);
      } catch (error) {
        if (isActive) setAnimalsError(error instanceof AnimalDataError ? error.message : 'We could not load your animals. Try again.');
      } finally {
        if (isActive) setAnimalsLoading(false);
      }
    };
    void loadAnimals();
    return () => { isActive = false; };
  }, [animalLoadAttempt]);

  useEffect(() => {
    let isActive = true;
    const loadRecords = async () => {
      setRecordsError('');
      try {
        const [milk, medicine] = await Promise.all([loadMyMilkRecords(), loadMyMedicineRecords()]);
        if (isActive) {
          setMilkRecords(milk);
          setMedicineRecords(medicine);
        }
      } catch (cause) {
        if (isActive) {
          setRecordsError(cause instanceof RecordDataError ? cause.message : 'We could not load your production and health records.');
        }
      }
    };
    void loadRecords();
    return () => { isActive = false; };
  }, [animalLoadAttempt]);

  useEffect(() => {
    let isActive = true;
    const loadListings = async () => {
      setMarketLoading(true);
      setMarketError('');
      try {
        const [active, mine] = await Promise.all([loadMarketplaceListings(), loadMyMarketplaceListings()]);
        if (isActive) {
          setMarketListings(active);
          setMyListings(mine);
        }
      } catch (cause) {
        if (isActive) {
          setMarketError(cause instanceof MarketplaceDataError ? cause.message : 'We could not load the marketplace. Try again.');
        }
      } finally {
        if (isActive) setMarketLoading(false);
      }
    };
    void loadListings();
    return () => { isActive = false; };
  }, [marketLoadAttempt]);

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2800);
  };

  const selectSection = (section: DashboardSection) => {
    setActiveSection(section);
    setSidebarOpen(false);
  };

  const handleLogout = async () => {
    const supabase = createClient();
    if (supabase) await supabase.auth.signOut();
    router.replace('/login');
    router.refresh();
  };

  const handleAnimalSaved = (savedAnimal: Animal, isEdit: boolean) => {
    if (isEdit) {
      setAnimals(current => current.map(item => item.id === savedAnimal.id ? savedAnimal : item));
      notify('Animal updated successfully');
    } else {
      setAnimals(current => [savedAnimal, ...current]);
      notify('Animal added successfully');
    }
    setAnimalsError('');
    setAddAnimalOpen(false);
    setAnimalToEdit(null);
  };

  const handleStartAddAnimal = () => {
    setAnimalToEdit(null);
    setAddAnimalOpen(true);
  };

  const handleStartEdit = (animal: Animal) => {
    setDialog(null);
    setAnimalToEdit(animal);
    setAddAnimalOpen(true);
  };

  const handleStartDelete = (animal: Animal) => {
    setDialog({ kind: 'delete-confirm', animal });
  };

  const handleConfirmDelete = async (animal: Animal) => {
    setIsDeleting(true);
    try {
      await deleteMyAnimal(animal.id, animal.photoPath);
      setAnimals(current => current.filter(item => item.id !== animal.id));
      setDialog(null);
      notify('Animal deleted successfully');
    } catch (cause) {
      notify(cause instanceof AnimalDataError ? cause.message : 'We could not delete this animal. Try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenAddMilk = (animalId?: string) => {
    setDialog({ kind: 'add-milk', animalId });
  };

  const handleOpenAddMedicine = (animalId?: string) => {
    setDialog({ kind: 'add-medicine', animalId });
  };

  const handleMilkSaved = (record: MilkRecord) => {
    setMilkRecords((current) => [record, ...current.filter((item) => item.id !== record.id)]);
    setDialog(null);
    notify(`Milk record saved — ${record.amountLitres} L on ${record.recordedOn}.`);
  };

  const handleMedicineSaved = (record: MedicineRecord) => {
    setMedicineRecords((current) => [record, ...current.filter((item) => item.id !== record.id)]);
    const animal = animals.find((a) => a.id === record.animalId);
    setDialog(null);
    notify(`${record.medicineName} logged for ${animal ? animal.name : 'this animal'}.`);
  };

  const handleListingCreated = (listing: MarketplaceListing) => {
    setMarketListings((current) => [listing, ...current]);
    setMyListings((current) => [listing, ...current]);
    if (marketFilter !== 'All' && marketFilter !== listing.category) setMarketFilter(listing.category);
    setActiveSection('marketplace');
    setDialog(null);
    notify('Your listing is now live in the marketplace.');
  };

  const handleListingDeleted = async (listing: MarketplaceListing) => {
    try {
      await deleteMarketplaceListing(listing.id);
      setMarketListings((current) => current.filter((item) => item.id !== listing.id));
      setMyListings((current) => current.filter((item) => item.id !== listing.id));
      if (dialog?.kind === 'listing-details' && dialog.listingId === listing.id) setDialog(null);
      notify('Listing removed from the marketplace.');
    } catch (cause) {
      notify(cause instanceof MarketplaceDataError ? cause.message : 'We could not remove that listing. Try again.');
    }
  };

  const handleSaveProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setProfileName(String(formData.get('name') ?? '').trim() || 'Farmer');
    setFarmLocation(String(formData.get('location') ?? '').trim() || 'Location not set');
    notify('Profile updated for this session preview.');
  };

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      selectSection('livestock');
    }
  };

  const renderOverview = () => (
    <>
      <SectionHeading
        eyebrow="FARM OVERVIEW / LIVE HERD DATA"
        title={`Welcome back, ${displayName}.`}
        description={`${farmLocation} · Here is what is happening across your herd today.`}
        action={
          <button
            type="button"
            onClick={handleStartAddAnimal}
            className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[#34D399] px-4 text-sm font-bold text-[#07150F] transition-colors hover:bg-[#6EE7B7]"
          >
            <Plus className="size-4" /> Add animal
          </button>
        }
      />

      {animalsError && (
        <div
          role="alert"
          className="mb-4 flex flex-wrap items-center justify-between gap-3 border border-[#FB7185]/25 bg-[#FB7185]/[0.07] p-3 text-xs text-[#FDA4AF]"
        >
          <span>{animalsError}</span>
          <button
            type="button"
            onClick={() => setAnimalLoadAttempt((attempt) => attempt + 1)}
            className="font-bold underline underline-offset-4"
          >
            Retry
          </button>
        </div>
      )}
      {animalsLoading && <p role="status" className="mb-4 text-xs text-[#829189]">Loading animals from your account…</p>}

      <section aria-label="Farm weather" className="mb-4 grid gap-3 rounded-lg border border-[#24372D] bg-[#111D18] p-4 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:p-5">
        <span className="flex size-11 items-center justify-center rounded-md bg-[#12342A] text-[#67E8F9]"><CloudSun aria-hidden="true" className="size-6" /></span>
        <div>
          <p className="text-[10px] font-bold tracking-[0.16em] text-[#67E8F9]">LOCAL WEATHER PREVIEW</p>
          <p className="mt-1 text-sm font-semibold text-[#E7EFEA]">Partly cloudy in Kericho <span className="font-normal text-[#9AA9A0]">· sample conditions</span></p>
        </div>
        <div className="flex items-center gap-4 text-xs text-[#9AA9A0] sm:justify-end"><span className="text-xl font-bold text-[#F0F5F2]">24°C</span><span>Low 18° · High 27°<br />Humidity 62%</span></div>
      </section>

      <div className="mb-7 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <MetricCard label="My herd" value={String(animals.length)} detail="Saved animals in your account" icon={Beef} tone="green" />
        <MetricCard label="Healthy" value={String(healthyCount)} detail="Current health status" icon={ShieldCheck} tone="green" />
        <MetricCard label="Needs attention" value={String(attentionCount)} detail="Due or follow-up" icon={Activity} tone="amber" />
        <MetricCard label="Milk today" value={milkToday ? `${milkToday} L` : '0 L'} detail={milkToday ? 'Production logged today' : 'No milk logged today'} icon={Milk} tone="cyan" />
      </div>

      <SectionHeading eyebrow="FARM TOOLS" title="Quick actions" description="Pick up a common task without leaving your overview." />
      <div className="mb-7 grid grid-cols-2 gap-5 sm:gap-8">
        <QuickAction
          icon={Stethoscope}
          title="Find a vet"
          note="Connect with licensed veterinary officers and livestock animal health practitioners in your county."
          highlights={['Verified vets', 'On-farm visits', 'Emergency advisory']}
          actionLabel="Find nearby vets"
          tone="cyan"
          onClick={() => selectSection('vet')}
        />
        <QuickAction
          icon={CreditCard}
          title="Finance & credit"
          note="Explore low-interest livestock financing, input credit, seasonal loans, and financial planning tools."
          highlights={['Input loans', 'Flexible terms', 'Partner SACCOs']}
          actionLabel="Explore financing"
          tone="blue"
          onClick={() => selectSection('finance')}
        />
        <QuickAction
          icon={Wheat}
          title="Buy feed & supplements"
          note="Source quality dairy meal, mineral salts, hay bales, and silage directly from certified agro-dealers."
          highlights={['High protein meal', 'Mineral licks', 'Bulk orders']}
          actionLabel="Shop livestock feed"
          tone="amber"
          onClick={() => {
            setMarketFilter('Feed');
            selectSection('marketplace');
          }}
        />
        <QuickAction
          icon={Package}
          title="Farm equipment"
          note="Equip your farm with portable milking machines, automated drinkers, churns, and chaff cutters."
          highlights={['Milking machines', 'Feed processing', 'Verified sellers']}
          actionLabel="Browse equipment"
          tone="blue"
          onClick={() => {
            setMarketFilter('Equipment');
            selectSection('marketplace');
          }}
        />
        <QuickAction
          icon={ShieldCheck}
          title="Livestock insurance"
          note="Protect your dairy cows, beef cattle, and small stock against diseases, drought, and accidental mortality."
          highlights={['Mortality cover', 'Fast claim review', 'Subsidized rates']}
          actionLabel="Get insurance cover"
          tone="green"
          onClick={() => selectSection('finance')}
        />
        <QuickAction
          icon={Plus}
          title="List an animal for sale"
          note="Reach thousands of livestock buyers across Kenya and sell your animals at fair, transparent market prices."
          highlights={['Direct buyer chat', 'Verified pedigree', 'Fast listing']}
          actionLabel="Post animal listing"
          tone="gold"
          onClick={() => setDialog({ kind: 'post-listing' })}
        />
      </div>

      <Panel
        title="Recent activity"
        icon={Activity}
        className="mt-8"
        action={<span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#829189]">Live · from your herd</span>}
      >
        <RecentActivity animals={animals} milkRecords={milkRecords} medicineRecords={medicineRecords} />
      </Panel>

      <div className="mt-5 flex items-start gap-4 rounded-lg border border-[#F3C96A]/30 bg-[#F3C96A]/[0.06] p-4 sm:items-center sm:p-6">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-[#E49B0F]/15 text-[#F3C96A]">
          <Sparkles aria-hidden="true" className="size-5" />
        </span>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#F3C96A]">Pro Tip of the Day</p>
          <p className="mt-1 text-sm leading-relaxed text-[#D9E3DD] sm:text-base">
            Monitor your cows&apos; milk production daily to detect early signs of health issues. A sudden drop could indicate stress or illness.
          </p>
        </div>
      </div>
    </>
  );

  const renderLivestock = () => (
    <>
      <SectionHeading
        eyebrow="FARM / LIVESTOCK"
        title="My livestock"
        description="Search, view, edit, and manage animal records saved to your account."
        action={
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={handleStartAddAnimal}
              className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[#34D399] px-4 text-sm font-bold text-[#07150F] transition-colors hover:bg-[#6EE7B7]"
            >
              <Plus className="size-4" /> Add animal
            </button>
            <button
              type="button"
              onClick={() => handleOpenAddMilk()}
              title="Log milk production"
              className="group inline-flex min-h-11 items-center gap-2 rounded-full border border-[#22D3EE]/30 bg-gradient-to-r from-[#0B2025] to-[#0B1511] py-1 pl-1 pr-3 text-sm font-semibold text-[#67E8F9] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_4px_12px_rgba(34,211,238,0.14)] transition-all hover:-translate-y-0.5 hover:border-[#22D3EE]/60 hover:from-[#0C262C]"
            >
              <span className="flex size-8 items-center justify-center rounded-full bg-[#22D3EE]/15 ring-1 ring-[#22D3EE]/30 transition-colors group-hover:bg-[#22D3EE]/25">
                <Milk className="size-4" />
              </span>
              Add milk
            </button>
            <button
              type="button"
              onClick={() => handleOpenAddMedicine()}
              title="Log medicine and treatment"
              className="group inline-flex min-h-11 items-center gap-2 rounded-full border border-[#FB7185]/30 bg-gradient-to-r from-[#21141A] to-[#0B1511] py-1 pl-1 pr-3 text-sm font-semibold text-[#FDA4AF] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_4px_12px_rgba(251,113,133,0.14)] transition-all hover:-translate-y-0.5 hover:border-[#FB7185]/60 hover:from-[#2A171E]"
            >
              <span className="flex size-8 items-center justify-center rounded-full bg-[#FB7185]/15 ring-1 ring-[#FB7185]/30 transition-colors group-hover:bg-[#FB7185]/25">
                <Pill className="size-4" />
              </span>
              Add medicine
            </button>
          </div>
        }
      />
      <div className="mb-4 grid gap-3 rounded-lg border border-[#24372D] bg-[#111D18] p-3 sm:grid-cols-[1fr_auto_auto]">
        <label className="relative block">
          <span className="sr-only">Search herd</span>
          <Search aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#718178]" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-10 w-full rounded-md border border-[#2A4033] bg-[#0B1511] pl-9 pr-3 text-sm text-[#E7EFEA] outline-none focus:border-[#34D399]"
            placeholder="Search tag, name, breed…"
          />
        </label>
        <label>
          <span className="sr-only">Filter species</span>
          <select
            value={speciesFilter}
            onChange={(event) => setSpeciesFilter(event.target.value)}
            className="h-10 w-full rounded-md border border-[#2A4033] bg-[#0B1511] px-3 text-sm text-[#E7EFEA] outline-none focus:border-[#34D399]"
          >
            <option>All species</option>
            {Array.from(new Set(['Cow', 'Goat', 'Sheep', 'Pig', ...animals.map((a) => a.species)])).map((species) => (
              <option key={species}>{species}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Filter health status</span>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-10 w-full rounded-md border border-[#2A4033] bg-[#0B1511] px-3 text-sm text-[#E7EFEA] outline-none focus:border-[#34D399]"
          >
            <option>All statuses</option>
            {(['Healthy', 'Due soon', 'Needs attention'] as AnimalStatus[]).map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </label>
      </div>
      {recordsError && (
        <div role="alert" className="mb-4 flex items-start gap-2.5 rounded-md border border-[#E49B0F]/30 bg-[#E49B0F]/[0.06] p-3 text-xs text-[#F3C96A]">
          <CircleHelp className="mt-0.5 size-4 shrink-0" />
          <span>{recordsError}</span>
        </div>
      )}
      {animalsError && (
        <div
          role="alert"
          className="mb-4 flex flex-wrap items-center justify-between gap-3 border border-[#FB7185]/25 bg-[#FB7185]/[0.07] p-3 text-xs text-[#FDA4AF]"
        >
          <span>{animalsError}</span>
          <button
            type="button"
            onClick={() => setAnimalLoadAttempt((attempt) => attempt + 1)}
            className="font-bold underline underline-offset-4"
          >
            Retry
          </button>
        </div>
      )}
      <p className="mb-3 text-xs font-medium text-[#829189]">
        {animalsLoading
          ? 'Loading animals…'
          : `Showing ${visibleAnimals.length} saved animal${visibleAnimals.length === 1 ? '' : 's'}`}
      </p>
      {visibleAnimals.length ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visibleAnimals.map((animal) => (
            <AnimalCard
              key={animal.id}
              animal={animal}
              milkLitres={milkRecords
                .filter((record) => record.animalId === animal.id)
                .reduce((sum, record) => sum + record.amountLitres, 0)}
              medicineCount={medicineRecords
                .filter((record) => record.animalId === animal.id).length}
              onDetails={() => setDialog({ kind: 'animal-details', animalId: animal.id })}
              onEdit={() => handleStartEdit(animal)}
              onDelete={() => handleStartDelete(animal)}
              onAddMilk={() => handleOpenAddMilk(animal.id)}
              onAddMedicine={() => handleOpenAddMedicine(animal.id)}
            />
          ))}
        </div>
      ) : (
        <EmptyState title="No animals match" note="Try a different search or filter." />
      )}
    </>
  );

  const renderMarketplace = () => {
    const activeTabClass = 'border-[#34D399]/50 bg-[#34D399]/10 text-[#6EE7B7]';
    return (
      <>
        <SectionHeading
          eyebrow="FARM / MARKETPLACE"
          title="Marketplace"
          description="Buy and sell livestock, feed, equipment, produce, and services with farmers across Kenya."
          action={
            <button
              type="button"
              onClick={() => setDialog({ kind: 'post-listing' })}
              className="group inline-flex min-h-11 items-center gap-2 rounded-full border border-[#F59E0B]/30 bg-gradient-to-r from-[#2A1F0D] to-[#111D18] py-1 pl-1 pr-4 text-sm font-semibold text-[#FCD34D] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_4px_12px_rgba(245,158,11,0.16)] transition-all hover:-translate-y-0.5 hover:border-[#F59E0B]/60 hover:from-[#33270F]"
            >
              <span className="flex size-8 items-center justify-center rounded-full bg-[#F59E0B]/15 ring-1 ring-[#F59E0B]/30 transition-colors group-hover:bg-[#F59E0B]/25">
                <Plus className="size-4" />
              </span>
              Post a listing
            </button>
          }
        />

        {marketError && (
          <div role="alert" className="mb-5 flex flex-wrap items-center justify-between gap-3 border border-[#E49B0F]/30 bg-[#E49B0F]/[0.06] p-3 text-xs text-[#F3C96A]">
            <span className="inline-flex items-center gap-2"><CircleHelp className="size-4 shrink-0" /> {marketError}</span>
            <button type="button" onClick={() => setMarketLoadAttempt((attempt) => attempt + 1)} className="font-bold underline underline-offset-4">Retry</button>
          </div>
        )}

        <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Marketplace categories">
          {marketTabs.map(tab => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={marketFilter === tab}
              onClick={() => setMarketFilter(tab)}
              className={`inline-flex min-h-9 items-center gap-1.5 rounded-md border px-3 text-xs font-semibold transition-colors ${marketFilter === tab ? activeTabClass : 'border-[#24372D] bg-[#111D18] text-[#9AA9A0] hover:text-white'}`}
            >
              {tab !== 'All' && <span className="text-[#718178]">{listingCategoryIcon(tab as ListingCategory)}</span>}
              {tab}
            </button>
          ))}
        </div>

        <div className="mb-4 grid gap-3 rounded-lg border border-[#24372D] bg-[#111D18] p-3 sm:grid-cols-[1fr_auto_auto]">
          <label className="relative block">
            <span className="sr-only">Search listings</span>
            <Search aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#718178]" />
            <input
              value={marketSearch}
              onChange={(event) => setMarketSearch(event.target.value)}
              placeholder="Search livestock, feed, machines…"
              className="h-10 w-full rounded-md border border-[#2A4033] bg-[#0B1511] pl-9 pr-3 text-sm text-[#E7EFEA] outline-none focus:border-[#34D399]"
            />
          </label>
          <label>
            <span className="sr-only">Filter by county</span>
            <select
              value={countyFilter}
              onChange={(event) => setCountyFilter(event.target.value)}
              className="h-10 w-full rounded-md border border-[#2A4033] bg-[#0B1511] px-3 text-sm text-[#E7EFEA] outline-none focus:border-[#34D399]"
            >
              <option>All counties</option>
              {KENYA_COUNTIES.map((county) => <option key={county}>{county}</option>)}
            </select>
          </label>
          <label>
            <span className="sr-only">Sort listings</span>
            <select
              value={listingSort}
              onChange={(event) => setListingSort(event.target.value as ListingSort)}
              className="h-10 w-full rounded-md border border-[#2A4033] bg-[#0B1511] px-3 text-sm text-[#E7EFEA] outline-none focus:border-[#34D399]"
            >
              <option value="newest">Newest first</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
            </select>
          </label>
        </div>

        <div className="mb-4 flex items-center justify-between text-xs text-[#829189]">
          <span>{marketLoading ? 'Loading listings…' : `${visibleListings.length} active listing${visibleListings.length === 1 ? '' : 's'}`}</span>
          <span className="inline-flex items-center gap-1"><Filter className="size-3" /> {marketFilter}</span>
        </div>

        {marketLoading ? (
          <p className="text-xs text-[#829189]">Fetching the latest listings…</p>
        ) : visibleListings.length ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {visibleListings.map(listing => (
              <ListingCard
                key={listing.id}
                listing={listing}
                onView={() => setDialog({ kind: 'listing-details', listingId: listing.id })}
              />
            ))}
          </div>
        ) : (
          <EmptyState title="No listings found" note="Try a different category, county, or search — or post the first listing." />
        )}

        <div className="mt-8">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-[#E7EFEA]">My listings</h2>
            <span className="rounded-full border border-[#24372D] bg-[#111D18] px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-[#718178]">{myListings.length}</span>
          </div>
          {myListings.length ? (
            <div className="overflow-hidden rounded-lg border border-[#24372D]">
              <div className="divide-y divide-[#24372D]">
                {myListings.map(listing => (
                  <div key={listing.id} className="flex flex-wrap items-center justify-between gap-3 bg-[#111D18] px-4 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-[#2A4033] text-[#C4D0C9]">{listingCategoryIcon(listing.category)}</span>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-[#E7EFEA]">{listing.title}</p>
                        <p className="mt-0.5 text-[10px] text-[#829189]">{listing.category} · {listing.locationCounty} · {formatKsh(listing.priceKsh)}{listing.negotiable ? ' · negotiable' : ''}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full border px-2 py-1 text-[9px] font-bold ${listing.status === 'Active' ? 'border-[#34D399]/25 bg-[#34D399]/10 text-[#6EE7B7]' : 'border-[#FBBF24]/25 bg-[#FBBF24]/10 text-[#FCD34D]'}`}>{listing.status}</span>
                      <button type="button" onClick={() => setDialog({ kind: 'listing-details', listingId: listing.id })} className="rounded-md border border-[#2A4033] px-2.5 py-1.5 text-[9px] font-semibold text-[#D4DED8] hover:border-[#34D399]">View</button>
                      <button type="button" onClick={() => void handleListingDeleted(listing)} aria-label={`Remove ${listing.title}`} className="flex size-8 items-center justify-center rounded-md border border-[#2A4033] text-[#9AA9A0] hover:border-[#FB7185]/40 hover:text-[#FDA4AF]">
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState title="You have no listings yet" note="Post your first listing and reach farmers across Kenya." />
          )}
        </div>
      </>
    );
  };

  const renderVet = () => (
    <>
      <SectionHeading eyebrow="SERVICES / VETERINARY" title="Vet & advisory" description="Explore sample veterinary providers. Booking requests are preview-only." />
      <div className="mb-5 flex items-start gap-3 rounded-md border border-[#67E8F9]/20 bg-[#67E8F9]/5 p-4 text-sm text-[#B8C5BE]"><Stethoscope className="mt-0.5 size-4 shrink-0 text-[#67E8F9]" /><p>Choose a provider to prepare an appointment request. Live scheduling will connect when services are configured.</p></div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{providers.map(provider => <ProviderCard key={provider.name} provider={provider} onBook={() => setDialog({ kind: 'book-vet', provider: provider.name })} />)}</div>
    </>
  );

  const renderFinance = () => (
    <>
      <SectionHeading eyebrow="SERVICES / FINANCE" title="Finance & insurance" description="Compare example partner options. Eligibility and quotes require provider integration." />
      <div className="mb-5 flex items-start gap-3 rounded-md border border-[#FBBF24]/20 bg-[#FBBF24]/5 p-4 text-sm text-[#B8C5BE]"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#FBBF24]" /><p>These are sample options for the dashboard preview, not offers or eligibility decisions.</p></div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Loan options" icon={CreditCard}><PartnerRow name="Bomet SACCO" detail="Example partner · check eligibility" badge="Explore" onClick={() => notify('Eligibility checks will be provided by the connected finance partner.')} /><PartnerRow name="Kenya Farmers SACCO" detail="Example partner · livestock lending" badge="Explore" onClick={() => notify('Partner connection is not configured in this preview.')} /><PartnerRow name="Equity Agri Finance" detail="Example partner · agriculture loans" badge="Learn more" onClick={() => notify('Partner connection is not configured in this preview.')} /></Panel>
        <Panel title="Livestock cover" icon={ShieldCheck}><PartnerRow name="APA Livestock Cover" detail="Example provider · request a quote" badge="Quote" onClick={() => notify('Insurance quotes will connect to the provider in a later setup.')} /><PartnerRow name="CIC Livestock Cover" detail="Example provider · herd protection" badge="Quote" onClick={() => notify('Insurance quotes will connect to the provider in a later setup.')} /><PartnerRow name="Jubilee Insurance" detail="Example provider · explore cover" badge="Explore" onClick={() => notify('Insurance quotes will connect to the provider in a later setup.')} /></Panel>
      </div>
    </>
  );

  const renderAnalytics = () => {
    const week = lastSevenDays();
    const weekTotal = milkRecords.reduce((total, record) => (week.some((day) => day.iso === record.recordedOn) ? total + record.amountLitres : total), 0);
    const weekMilkCount = milkRecords.filter((record) => week.some((day) => day.iso === record.recordedOn)).length;

    const weekStartMs = new Date(`${week[0].iso}T00:00:00`).getTime();
    const prevWeekTotal = milkRecords.reduce((total, record) => {
      const at = new Date(`${record.recordedOn}T00:00:00`).getTime();
      if (at < weekStartMs && at >= weekStartMs - 7 * 86_400_000) total += record.amountLitres;
      return total;
    }, 0);
    const weekPct = prevWeekTotal > 0 ? Math.round((weekTotal / prevWeekTotal - 1) * 100) : null;

    const animalById = new Map(animals.map((animal) => [animal.id, animal]));
    const producerTotals = new Map<string, number>();
    for (const record of milkRecords) {
      if (week.some((day) => day.iso === record.recordedOn)) {
        producerTotals.set(record.animalId, (producerTotals.get(record.animalId) ?? 0) + record.amountLitres);
      }
    }
    const topProducers = [...producerTotals.entries()]
      .map(([id, litres]) => ({ animal: animalById.get(id), litres }))
      .filter((entry): entry is { animal: Animal; litres: number } => Boolean(entry.animal))
      .sort((a, b) => b.litres - a.litres)
      .slice(0, 5);
    const maxProducer = topProducers[0]?.litres ?? 1;

    const dueCount = animals.filter((animal) => animal.status === 'Due soon').length;
    const needsCount = animals.filter((animal) => animal.status === 'Needs attention').length;
    const healthyPct = animals.length ? Math.round((healthyCount / animals.length) * 100) : 0;
    const duePct = animals.length ? Math.round((dueCount / animals.length) * 100) : 0;
    const needsPct = animals.length ? Math.max(0, 100 - healthyPct - duePct) : 0;
    const donutSegs: [number, string][] = animals.length
      ? ([[healthyPct, '#34D399'], [duePct, '#FBBF24'], [needsPct, '#FB7185']] as [number, string][]).filter(([pct]) => pct > 0)
      : [[100, '#24372D']];
    let acc = 0;
    const donutGradient = `conic-gradient(${donutSegs.map(([pct, color]) => {
      const from = acc;
      acc += pct;
      return `${color} ${from}% ${acc}%`;
    }).join(', ')})`;

    const treatmentCount = medicineRecords.length;
    const treatmentsThisWeek = medicineRecords.filter((record) => week.some((day) => day.iso === record.givenOn)).length;
    const medCatCounts = new Map<string, number>();
    for (const record of medicineRecords) medCatCounts.set(record.category, (medCatCounts.get(record.category) ?? 0) + 1);
    const topMedCats = [...medCatCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);

    const speciesTotals = new Map<string, number>();
    for (const animal of animals) speciesTotals.set(animal.species, (speciesTotals.get(animal.species) ?? 0) + 1);
    const speciesOrdered = [...speciesTotals.entries()].sort((a, b) => b[1] - a[1]);
    const speciesColor: Record<string, string> = { Cow: '#34D399', Goat: '#67E8F9', Sheep: '#FBBF24', Poultry: '#FB7185', Pig: '#93C5FD' };

    const lactating = animals.filter((animal) => animal.breedingStatus === 'Lactating').length;
    const pregnant = animals.filter((animal) => animal.breedingStatus === 'Pregnant').length;
    const dryCount = animals.filter((animal) => animal.breedingStatus === 'Dry').length;
    const bredCount = animals.filter((animal) => animal.breedingStatus === 'Bred' || animal.breedingStatus === 'Open').length;

    const todayMs = new Date(dateToday).getTime();
    const upcomingCalvings = animals
      .map((animal) => ({
        animal,
        days: animal.expectedDeliveryDate ? Math.round((new Date(animal.expectedDeliveryDate).getTime() - todayMs) / 86_400_000) : Infinity,
      }))
      .filter((entry) => entry.days <= 60)
      .sort((a, b) => a.days - b.days);
    const nearestCalving = upcomingCalvings[0];

    const assetValue = animals.reduce((total, animal) => total + (animal.purchasePriceKsh ?? 0), 0);
    const valuedCount = animals.filter((animal) => animal.purchasePriceKsh != null).length;
    const assetLabel = assetValue >= 1_000_000
      ? `KSh ${(assetValue / 1_000_000).toFixed(1)}M`
      : assetValue >= 1000
        ? `KSh ${Math.round(assetValue / 1000)}K`
        : `KSh ${assetValue}`;

    const description = animals.length || weekTotal || treatmentsThisWeek
      ? `You logged ${weekTotal.toLocaleString('en-KE')} L of milk across ${weekMilkCount} record${weekMilkCount === 1 ? '' : 's'} this week${treatmentsThisWeek ? ` and ${treatmentsThisWeek} treatment${treatmentsThisWeek === 1 ? '' : 's'}` : ''}.${topProducers[0] ? ` Your top producer is ${topProducers[0].animal.name}.` : ''}`
      : 'Add animals and start logging milk and treatments to unlock performance summaries.';

    const milkByDate = new Map<string, number>();
    for (const record of milkRecords) milkByDate.set(record.recordedOn, (milkByDate.get(record.recordedOn) ?? 0) + record.amountLitres);
    const nowDate = new Date();
    const milkBuckets = buildMilkBuckets(milkPeriod, milkByDate, nowDate);
    const periodTotal = milkBuckets.reduce((total, bucket) => total + bucket.value, 0);
    const periodAvg = periodTotal / milkBuckets.length;
    const periodPeak = milkBuckets.reduce((best, bucket) => (bucket.value > best.value ? bucket : best), milkBuckets[0]);
    const periodCurrent = milkBuckets[milkBuckets.length - 1]?.value ?? 0;
    const periodPrevious = milkBuckets.length > 1 ? (milkBuckets[milkBuckets.length - 2]?.value ?? 0) : 0;
    const dropAlert = periodPrevious > 0 && periodCurrent < periodPrevious * 0.6;
    const periodNoun = milkPeriod === 'daily' ? 'day' : milkPeriod === 'weekly' ? 'week' : 'month';
    const periodSummary = milkPeriod === 'daily'
      ? `You averaged ${periodAvg.toFixed(1)} L/day across the last ${milkBuckets.length} days.`
      : milkPeriod === 'weekly'
        ? `You produced ${periodTotal.toLocaleString('en-KE')} L across the last ${milkBuckets.length} weeks — ${(periodTotal / milkBuckets.length).toLocaleString('en-KE')} L/week average.`
        : `You produced ${periodTotal.toLocaleString('en-KE')} L across the last ${milkBuckets.length} months — ${Math.round(periodTotal / milkBuckets.length).toLocaleString('en-KE')} L/month average.`;
    const handleExport = () => {
      downloadCsv(`milk-production-${milkPeriod}.csv`, ['Period', 'Litres'], milkBuckets.map((bucket) => [bucket.iso, String(bucket.value)]));
      notify(`${milkPeriod.charAt(0).toUpperCase()}${milkPeriod.slice(1)} milk report downloaded.`);
    };
    const reportStartDate = new Date(nowDate);
    reportStartDate.setDate(reportStartDate.getDate() - 6);
    const reportStartIso = reportStartDate.toISOString().split('T')[0];
    const reportRange = `${milkBucketLabel(reportStartIso)} – ${milkBucketLabel(dateToday)}`;
    const weeklyReportRows: string[][] = [
      ['Covered period', reportRange],
      ['Milk produced', `${weekTotal.toLocaleString('en-KE')} L`],
      ['vs previous week', weekPct !== null ? `${weekPct >= 0 ? '+' : ''}${weekPct}%` : 'No previous data'],
      ['Milk records', String(weekMilkCount)],
      ['Average per day', `${(weekTotal / Math.max(weekMilkCount, 1)).toFixed(1)} L`],
      ['Top producer', topProducers[0] ? `${topProducers[0].animal.name} (${topProducers[0].litres.toLocaleString('en-KE')} L)` : 'None yet'],
      ['Treatments logged', String(treatmentsThisWeek)],
      ['Herd health', animals.length ? `${healthyPct}% (${healthyCount}/${animals.length})` : 'No animals yet'],
      ['Herd size', `${animals.length} animal${animals.length === 1 ? '' : 's'}`],
    ];

    return (
      <>
        <SectionHeading
          eyebrow="FARM / INSIGHTS"
          title="Farm insights"
          description={description}
          action={<button type="button" onClick={handleExport} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[#2A4033] px-3 text-xs font-semibold text-[#C4D0C9] hover:border-[#34D399]"><Download className="size-4" /> Export report</button>}
        />

        <div className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
          <MetricCard label="Milk this week" value={`${weekTotal.toLocaleString('en-KE')} L`} detail={weekPct !== null ? `▲ ${Math.abs(weekPct)}% vs last week` : 'No milk logged last week'} icon={Droplets} tone="cyan" />
          <MetricCard label="Herd health" value={`${healthyPct}%`} detail={`${healthyCount} healthy · ${attentionCount} need attention`} icon={HeartPulse} tone="green" />
          <MetricCard label="Treatments this week" value={String(treatmentsThisWeek)} detail={treatmentCount ? `Total logged: ${treatmentCount}${topMedCats[0] ? ` · ${topMedCats[0][0]}` : ''}` : 'No treatments logged yet'} icon={Beaker} tone="amber" />
          <MetricCard label="Herd asset value" value={assetLabel} detail={valuedCount ? `Based on ${valuedCount} recorded purchase${valuedCount === 1 ? '' : 's'}` : 'No purchase values recorded'} icon={Coins} tone="blue" />
        </div>

        <section aria-label="Insights charts" className="mb-4 grid gap-3 lg:grid-cols-3">
          <Panel
            title="Milk production"
            icon={Milk}
            className="lg:col-span-2"
            action={
              <div className="flex items-center gap-1 rounded-md border border-[#24372D] bg-[#0B1511] p-0.5">
                {(['daily', 'weekly', 'yearly'] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setMilkPeriod(option)}
                    className={`rounded px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide transition-colors ${milkPeriod === option ? 'bg-[#34D399]/15 text-[#6EE7B7]' : 'text-[#718178] hover:text-white'}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            }
          >
            <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
              <p className="text-[11px] leading-relaxed text-[#829189]">
                {periodSummary}{' '}
                {dropAlert ? (
                  <span className="ml-1 inline-flex items-center gap-1 rounded border border-[#FBBF24]/30 bg-[#FBBF24]/10 px-1.5 py-0.5 text-[9px] font-bold text-[#FCD34D]">
                    <ArrowUpRight className="size-3 rotate-90" /> Down {Math.round((1 - periodCurrent / periodPrevious) * 100)}% {milkPeriod === 'daily' ? 'vs yesterday' : milkPeriod === 'weekly' ? 'vs last week' : 'vs last month'}
                  </span>
                ) : (
                  <span className="ml-1 inline-flex items-center gap-1 rounded border border-[#34D399]/30 bg-[#34D399]/10 px-1.5 py-0.5 text-[9px] font-bold text-[#6EE7B7]">
                    <Activity className="size-3" /> {periodCurrent.toLocaleString('en-KE')} L latest {periodNoun}
                  </span>
                )}
              </p>
              <button type="button" onClick={handleExport} className="inline-flex items-center justify-center gap-1.5 rounded-md border border-[#2A4033] px-2.5 py-1 text-[9px] font-semibold text-[#C4D0C9] hover:border-[#34D399]"><Download className="size-3" /> Export CSV</button>
            </div>

            {periodTotal > 0 ? (
              <MilkAreaChart buckets={milkBuckets} />
            ) : (
              <p className="py-10 text-center text-xs leading-relaxed text-[#829189]">No milk logged in this period. Start logging and the trend curve will appear here.</p>
            )}

            <div className="mt-3 grid grid-cols-3 gap-2 border-t border-[#24372D]/80 pt-3 text-center">
              <div>
                <p className="text-[8.5px] font-bold uppercase tracking-[0.12em] text-[#718178]">Average</p>
                <p className="mt-0.5 font-mono text-sm font-bold text-[#E7EFEA]">{periodAvg.toFixed(periodAvg >= 1000 ? 0 : 1)} L</p>
              </div>
              <div>
                <p className="text-[8.5px] font-bold uppercase tracking-[0.12em] text-[#718178]">Peak</p>
                <p className="mt-0.5 font-mono text-sm font-bold text-[#6EE7B7]">{periodPeak.value.toLocaleString('en-KE')} L</p>
              </div>
              <div>
                <p className="text-[8.5px] font-bold uppercase tracking-[0.12em] text-[#718178]">Total</p>
                <p className="mt-0.5 font-mono text-sm font-bold text-[#E7EFEA]">{periodTotal.toLocaleString('en-KE')} L</p>
              </div>
            </div>
          </Panel>

          <Panel title="Top producers" icon={Beef} action={topProducers.length > 0 && <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#829189]">This week</span>}>
            {topProducers.length ? (
              topProducers.map(({ animal, litres }, index) => (
                <div key={animal.id} className="mb-3 last:mb-0">
                  <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
                    <span className="truncate text-[#C4D0C9]"><span className="font-mono text-[#718178]">{String(index + 1).padStart(2, '0')}</span> <span className="font-semibold">{animal.name}</span> <span className="text-[#718178]">({animal.tagNumber})</span></span>
                    <span className="shrink-0 font-mono font-bold text-[#6EE7B7]">{litres.toLocaleString('en-KE')} L</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-[#24372D]">
                    <div className="h-full rounded-full bg-gradient-to-r from-[#087B52] to-[#6EE7B7]" style={{ width: `${(litres / maxProducer) * 100}%` }} />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs leading-relaxed text-[#829189]">Producers will rank here once you log milk this week.</p>
            )}
          </Panel>

          <Panel title="Health snapshot" icon={HeartPulse} action={<span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#829189]">{animals.length} animals</span>}>
            <div className="flex items-center gap-5">
              <div className="relative size-28 shrink-0 rounded-full" style={{ background: donutGradient }}>
                <div className="absolute inset-2.5 grid place-items-center rounded-full bg-[#111D18]">
                  <span className="text-lg font-black text-[#F0F5F2]">{animals.length ? `${healthyPct}%` : '—'}</span>
                </div>
              </div>
              <div className="min-w-0 flex-1 space-y-2.5">
                {[
                  { label: 'Healthy', value: healthyCount, dot: '#34D399' },
                  { label: 'Due soon', value: dueCount, dot: '#FBBF24' },
                  { label: 'Needs attention', value: needsCount, dot: '#FB7185' },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between gap-2 text-xs">
                    <span className="flex items-center gap-2 text-[#C4D0C9]"><span className="size-2 rounded-full" style={{ backgroundColor: row.dot }} />{row.label}</span>
                    <span className="font-mono font-bold text-[#E7EFEA]">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-4 border-t border-[#24372D]/80 pt-3 text-[11px] leading-relaxed text-[#829189]">
              {attentionCount > 0 ? `${attentionCount} animal${attentionCount === 1 ? '' : 's'} ${attentionCount === 1 ? 'is' : 'are'} due for a follow-up or treatment.` : 'Your herd is fully healthy — all animals are up to date.'}
            </p>
          </Panel>

          <Panel title="Treatment activity" icon={Beaker} action={<span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#829189]">All time: {treatmentCount}</span>}>
            <p className="text-4xl font-black tracking-tight text-[#F0F5F2]">{treatmentsThisWeek}</p>
            <p className="mt-1 text-[11px] text-[#829189]">treatments logged in the last 7 days</p>
            {topMedCats.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {topMedCats.map(([category, count]) => (
                  <span key={category} className="rounded-md border border-[#24372D] bg-[#0B1511] px-2.5 py-1 text-[10px] font-semibold text-[#AEBBB3]">
                    {category} · {count}
                  </span>
                ))}
              </div>
            )}
            {treatmentCount === 0 && <p className="mt-3 text-xs leading-relaxed text-[#829189]">Log medicine records and they will be summarised here.</p>}
          </Panel>

          <Panel title="Herd composition" icon={Activity} action={animals.length > 0 && <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#829189]">{animals.length} animals</span>}>
            {speciesOrdered.length ? (
              speciesOrdered.map(([name, count]) => (
                <DistributionRow key={name} label={name} value={count} total={speciesOrdered[0][1]} color={speciesColor[name] ?? '#9AA9A0'} />
              ))
            ) : (
              <p className="text-xs leading-relaxed text-[#829189]">Add animals to see how your herd is made up across species.</p>
            )}
          </Panel>

          <Panel title="Breeding radar" icon={CalendarDays} action={nearestCalving ? <span className="text-[10px] font-bold text-[#FCD34D]">Next · {nearestCalving.animal.name}</span> : undefined}>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Lactating', value: lactating, icon: Milk },
                { label: 'Pregnant', value: pregnant, icon: Baby },
                { label: 'Dry', value: dryCount, icon: Leaf },
                { label: 'Bred / open', value: bredCount, icon: Sprout },
              ].map(({ label, value, icon: ChipIcon }) => (
                <div key={label} className="flex items-center gap-2 rounded-md border border-[#24372D] bg-[#0B1511] px-2.5 py-2">
                  <ChipIcon className="size-3.5 text-[#67E8F9]" />
                  <span className="text-[10px] text-[#829189]">{label}</span>
                  <span className="ml-auto font-mono text-xs font-bold text-[#E7EFEA]">{value}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 border-t border-[#24372D]/80 pt-3">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#829189]">Calving soon · next 60 days</p>
              {upcomingCalvings.length ? (
                <>
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="truncate font-semibold text-[#C4D0C9]">{nearestCalving?.animal.name} <span className="font-normal text-[#718178]">({nearestCalving?.animal.tagNumber})</span></span>
                    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold ${(nearestCalving?.days ?? 0) < 0 ? 'border-[#FB7185]/25 bg-[#FB7185]/10 text-[#FDA4AF]' : 'border-[#FBBF24]/25 bg-[#FBBF24]/10 text-[#FCD34D]'}`}>
                      {(nearestCalving?.days ?? 0) < 0 ? `${Math.abs(nearestCalving?.days ?? 0)}d overdue` : (nearestCalving?.days ?? 0) === 0 ? 'Due today' : `Due in ${nearestCalving?.days}d`}
                    </span>
                  </div>
                  {upcomingCalvings.length > 1 && <p className="mt-2 text-[10px] text-[#829189]">+{upcomingCalvings.length - 1} more expected this window</p>}
                </>
              ) : (
                <p className="text-[11px] text-[#829189]">No calvings expected in the next two months.</p>
              )}
            </div>
          </Panel>
        </section>

        <Panel title="Weekly email report" icon={Mail} action={<span className="inline-flex items-center gap-1.5 rounded-md border border-[#24372D] bg-[#0B1511] px-2.5 py-1 text-[10px] text-[#9AA9A0]"><Mail className="size-3 text-[#67E8F9]" /> Every Monday · {email}</span>}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-bold text-[#F0F5F2]">Your ranch, delivered to your inbox</p>
            <button type="button" onClick={() => downloadCsv(`weekly-herd-report-${dateToday}.csv`, ['Metric', 'Value'], weeklyReportRows)} className="inline-flex items-center gap-1.5 rounded-md border border-[#2A4033] px-2.5 py-1 text-[10px] font-semibold text-[#C4D0C9] hover:border-[#34D399]"><Download className="size-3.5" /> Download preview</button>
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border border-[#24372D] bg-[#0B1511]">
            <div className="flex items-center justify-between border-b border-[#24372D] px-4 py-2.5">
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-[#FB7185]" />
                <span className="size-2.5 rounded-full bg-[#FBBF24]" />
                <span className="size-2.5 rounded-full bg-[#34D399]" />
              </div>
              <span className="text-[9px] font-medium tracking-wide text-[#718178]">news@olerairanchly.farm</span>
            </div>
            <div className="px-4 py-4">
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#829189]">Subject</p>
              <p className="mt-1 text-sm font-bold text-[#F0F5F2]">Your ranch at a glance — {reportRange} <span className="ml-1 inline-flex items-center gap-1 rounded bg-[#34D399]/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-[#6EE7B7]"><Sparkles className="size-3" /> Olerai Ranchly</span></p>

              <p className="mt-3 text-xs leading-relaxed text-[#9AA9A0]">
                Hi there, here is your weekly summary. You produced <span className="font-bold text-[#E7EFEA]">{weekTotal.toLocaleString('en-KE')} L</span> of milk across {weekMilkCount} record{weekMilkCount === 1 ? '' : 's'}
                {weekPct !== null ? <>, <span className={weekPct < 0 ? 'font-bold text-[#FCD34D]' : 'font-bold text-[#6EE7B7]'}>{weekPct >= 0 ? '+' : ''}{weekPct}%</span> vs the previous week</> : ''}.
                {topProducers[0] && <> <span className="text-[#C4D0C9]">{topProducers[0].animal.name}</span> led the herd with a steady output.</>}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  { label: 'Milk produced', value: `${weekTotal.toLocaleString('en-KE')} L`, tone: 'text-[#6EE7B7]' },
                  { label: 'vs last week', value: weekPct !== null ? `${weekPct >= 0 ? '+' : ''}${weekPct}%` : '—', tone: weekPct !== null && weekPct < 0 ? 'text-[#FCD34D]' : 'text-[#6EE7B7]' },
                  { label: 'Top producer', value: topProducers[0] ? topProducers[0].animal.name : 'None yet', tone: 'text-[#E7EFEA]' },
                  { label: 'Herd health', value: animals.length ? `${healthyPct}%` : '—', tone: healthyPct >= 80 ? 'text-[#6EE7B7]' : 'text-[#FCD34D]' },
                ].map((metric) => (
                  <div key={metric.label} className="rounded-lg border border-[#24372D] bg-[#111D18] p-3">
                    <p className="text-[8.5px] font-bold uppercase tracking-[0.12em] text-[#718178]">{metric.label}</p>
                    <p className={`mt-1 truncate text-base font-bold ${metric.tone}`}>{metric.value}</p>
                  </div>
                ))}
              </div>

              <p className="mt-4 border-t border-[#24372D] pt-3 text-[10px] leading-relaxed text-[#829189]">
                We will begin sending this to <span className="font-semibold text-[#C4D0C9]">{email}</span> every Monday — automatically, no extra setup on your end. Email delivery hasn&apos;t been configured yet, but this preview is exactly what you&apos;ll receive.
              </p>
            </div>
          </div>
        </Panel>
      </>
    );
  };

  const renderCommunity = () => (
    <>
      <SectionHeading eyebrow="COMMUNITY / LEARNING" title="Community & learning" description="Sample discussions from farmers and livestock professionals." action={<button type="button" onClick={() => notify('Posting will be available when community services are configured.')} className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[#34D399] px-4 text-sm font-bold text-[#07150F]"><Plus className="size-4" /> Ask a question</button>} />
      <div className="grid gap-4 xl:grid-cols-[1fr_300px]"><Panel title="Recent discussions" icon={MessageSquareText}>{[
        { title: 'A cow is not eating well after calving', author: 'Community sample', time: '2h ago', replies: 12, body: 'Share symptoms and connect with a livestock professional for advice.' },
        { title: 'Best feed supplements for dry season?', author: 'Community sample', time: '5h ago', replies: 24, body: 'Compare feed practices and learn from nearby livestock keepers.' },
        { title: 'Boer goat deworming schedule', author: 'Community sample', time: '1d ago', replies: 18, body: 'Discuss routine care with experienced farmers and veterinary professionals.' },
      ].map(post => <article key={post.title} className="border-b border-[#24372D] py-4 last:border-0"><div className="flex items-start justify-between gap-4"><h3 className="text-sm font-bold text-[#E7EFEA]">{post.title}</h3><span className="shrink-0 text-[10px] text-[#829189]">{post.time}</span></div><p className="mt-1 text-[11px] text-[#829189]">{post.author} · {post.replies} replies</p><p className="mt-3 text-sm leading-relaxed text-[#9AA9A0]">{post.body}</p></article>)}</Panel><Panel title="Community guidelines" icon={CircleHelp}><p className="text-sm leading-relaxed text-[#9AA9A0]">Protect personal information, share respectful advice, and contact a verified veterinary professional for urgent animal health needs.</p><button type="button" onClick={() => notify('Community guidelines are shown for this preview.')} className="mt-4 text-xs font-semibold text-[#34D399]">Review guidelines <ArrowRight className="ml-1 inline size-3" /></button></Panel></div>
    </>
  );

  const renderProfile = () => (
    <>
      <SectionHeading eyebrow="ACCOUNT / PROFILE" title="My profile" description="Edit your preview profile details." />
      <form onSubmit={handleSaveProfile} className="grid gap-4 xl:grid-cols-2">
        <Panel title="Personal information" icon={UserRound}><Field label="Full name" name="name" defaultValue={displayName} /><Field label="Email address" name="email" type="email" defaultValue={email} readOnly /><Field label="Farm location" name="location" defaultValue={farmLocation} /><Field label="Herd size" name="herdSize" defaultValue={`${animals.length} sample animals`} readOnly /><button className="mt-2 min-h-10 rounded-md bg-[#34D399] px-4 text-sm font-bold text-[#07150F]" type="submit">Save preview profile</button></Panel>
        <Panel title="Workspace access" icon={ShieldCheck}><div className="rounded-md border border-[#34D399]/20 bg-[#34D399]/5 p-4"><p className="text-sm font-bold text-[#E7EFEA]">Farmer workspace</p><p className="mt-1 text-xs text-[#9AA9A0]">Role switching and multi-role billing will connect after role configuration.</p></div><Link href="/portal#workspaces" className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-md border border-[#2A4033] px-3 text-xs font-semibold text-[#D3DED7] hover:border-[#34D399]">Manage roles <ArrowRight className="size-3" /></Link></Panel>
      </form>
    </>
  );

  const renderSettings = () => (
    <>
      <SectionHeading eyebrow="ACCOUNT / PREFERENCES" title="Settings" description="Manage preview preferences. Notification delivery is not connected yet." />
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Notifications" icon={Bell}>{([
          ['vaccination', 'Vaccination reminders', 'Get a reminder when herd care is due.'],
          ['market', 'Marketplace inquiries', 'Be notified about buyer activity.'],
          ['report', 'Weekly farm summary', 'Receive a weekly productivity recap.'],
          ['weather', 'Weather alerts', 'See local forecast notices.'],
        ] as const).map(([key, title, note]) => <ToggleRow key={key} title={title} note={note} checked={notifications[key]} onChange={checked => setNotifications(current => ({ ...current, [key]: checked }))} />)}</Panel>
        <Panel title="Language & region" icon={SlidersHorizontal}><label className="mb-4 block text-xs font-semibold text-[#C4D0C9]">Language<select className="mt-2 h-11 w-full rounded-md border border-[#2A4033] bg-[#0B1511] px-3 text-sm text-[#E7EFEA]"><option>English</option><option>Kiswahili</option></select></label><label className="block text-xs font-semibold text-[#C4D0C9]">Currency<select className="mt-2 h-11 w-full rounded-md border border-[#2A4033] bg-[#0B1511] px-3 text-sm text-[#E7EFEA]"><option>Kenyan Shilling (KSh)</option></select></label></Panel>
      </div>
    </>
  );

  const renderDialog = () => {
    if (!dialog) return null;
    const close = () => setDialog(null);

    // Delete confirmation modal
    if (dialog.kind === 'delete-confirm') {
      const animal = dialog.animal;
      return (
        <div
          className="fixed inset-0 z-[90] grid place-items-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isDeleting) close();
          }}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-animal-title"
            className="w-full max-w-md rounded-lg border border-[#FB7185]/30 bg-[#161214] p-5 shadow-2xl sm:p-6"
          >
            <div className="flex items-start gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#FB7185]/15 text-[#FDA4AF]">
                <AlertTriangle className="size-6" />
              </span>
              <div>
                <h2 id="delete-animal-title" className="text-lg font-bold text-[#F0F5F2]">
                  Delete {animal.name} ({animal.tagNumber})?
                </h2>
                <p className="mt-2 text-xs leading-relaxed text-[#AEBBB3]">
                  This action will permanently delete this animal record and any uploaded photos from your account. This cannot be undone.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t border-white/[0.08] pt-4">
              <button
                type="button"
                disabled={isDeleting}
                onClick={close}
                className="min-h-10 rounded-md border border-[#2A4033] px-4 text-xs font-semibold text-[#C4D0C9] hover:border-zinc-500 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => void handleConfirmDelete(animal)}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[#E11D48] px-4 text-xs font-bold text-white transition-colors hover:bg-[#BE123C] disabled:cursor-wait disabled:opacity-60"
              >
                {isDeleting ? 'Deleting animal…' : 'Delete animal'}
                <Trash2 className="size-4" />
              </button>
            </div>
          </section>
        </div>
      );
    }

    // Add milk dialog
    if (dialog.kind === 'add-milk') {
      return (
        <AddMilkDialog
          animals={animals}
          defaultAnimalId={dialog.animalId}
          onClose={close}
          onSaved={handleMilkSaved}
        />
      );
    }

    // Add medicine dialog
    if (dialog.kind === 'add-medicine') {
      return (
        <AddMedicineDialog
          animals={animals}
          defaultAnimalId={dialog.animalId}
          onClose={close}
          onSaved={handleMedicineSaved}
        />
      );
    }

    // Post a listing dialog
    if (dialog.kind === 'post-listing') {
      return (
        <PostListingDialog
          defaultCounty={farmLocation === 'Location not set' ? 'Kericho' : farmLocation}
          onClose={close}
          onCreated={handleListingCreated}
        />
      );
    }

    // Listing details modal
    if (dialog.kind === 'listing-details') {
      if (!activeListing) return null;
      const canManage = myListings.some((item) => item.id === activeListing.id);
      return (
        <ListingDetailsModal
          listing={activeListing}
          canManage={canManage}
          onClose={close}
          onDelete={canManage ? () => void handleListingDeleted(activeListing) : undefined}
        />
      );
    }

    // Animal details modal with comprehensive tabs
    if (dialog.kind === 'animal-details') {
      if (!activeAnimal) return null;
      return (
        <AnimalDetailsModal
          animal={activeAnimal}
          onClose={close}
          onEdit={() => handleStartEdit(activeAnimal)}
          onDelete={() => handleStartDelete(activeAnimal)}
          onAddMilk={() => handleOpenAddMilk(activeAnimal.id)}
          onAddMedicine={() => handleOpenAddMedicine(activeAnimal.id)}
          milkRecords={milkRecords}
          medicineRecords={medicineRecords}
        />
      );
    }

    const title = `Book ${dialog.provider}`;

    const onSubmit = (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      close();
      notify('Request saved in this preview.');
    };

    return (
      <div
        className="fixed inset-0 z-[80] grid place-items-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) close();
        }}
      >
        <section
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className="w-full max-w-lg rounded-lg border border-[#2A4033] bg-[#111D18] p-5 shadow-2xl sm:p-6"
        >
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold tracking-[0.16em] text-[#34D399]">FARM PREVIEW</p>
              <h2 className="mt-1 text-xl font-bold text-[#F0F5F2]">{title}</h2>
            </div>
            <button
              onClick={close}
              type="button"
              aria-label="Close dialog"
              className="flex size-9 items-center justify-center rounded-md border border-[#2A4033] text-[#9AA9A0] hover:text-white"
            >
              <X className="size-4" />
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <Field label="Preferred date" name="date" type="date" required defaultValue={dateToday} />
            <label className="block text-xs font-semibold text-[#C4D0C9]">
              What do you need help with?
              <textarea
                name="details"
                rows={3}
                className="mt-2 w-full rounded-md border border-[#2A4033] bg-[#0B1511] px-3 py-2 text-sm text-white outline-none focus:border-[#34D399]"
                placeholder="Briefly describe the concern"
              />
            </label>

            <div className="flex justify-end gap-2 border-t border-[#24372D] pt-4">
              <button
                type="button"
                onClick={close}
                className="min-h-10 rounded-md border border-[#2A4033] px-4 text-xs font-semibold text-[#C4D0C9]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="min-h-10 rounded-md bg-[#34D399] px-4 text-xs font-bold text-[#07150F]"
              >
                Save in preview
              </button>
            </div>
            <p className="text-[10px] leading-relaxed text-[#829189]">
              Preview only — this change is not yet saved to a live account.
            </p>
          </form>
        </section>
      </div>
    );
  };

  return (
    <div className="min-h-dvh bg-[#0A1410] text-[#F0F5F2]">
      {sidebarOpen && <button type="button" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-40 bg-black/65 lg:hidden" />}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col overflow-y-auto border-r border-[#1F3429] bg-[#09140F] transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Link href="/dashboard/farmer" className="flex items-center gap-3 border-b border-white/[0.07] px-5 py-4">
          <span className="flex size-10 items-center justify-center rounded-full bg-[#FFF1C7] ring-1 ring-[#E49B0F]/70"><Image src={logo} alt="" className="size-9 object-contain" /></span>
          <span className="text-base font-extrabold text-white">Olerai<span className="text-[#34D399]">Ranchly</span><span className="mt-1 block text-[9px] font-semibold tracking-[0.16em] text-[#7A8A82]">FARMER WORKSPACE</span></span>
        </Link>
        <div className="px-3 pt-4"><Link href="/portal#workspaces" className="flex items-center gap-3 rounded-md border border-[#34D399]/20 bg-[#34D399]/[0.07] p-3 transition-colors hover:bg-[#34D399]/[0.12]"><span className="flex size-9 items-center justify-center rounded-md bg-[#34D399]/15 text-[#6EE7B7]"><Beef className="size-4" /></span><span className="min-w-0 flex-1"><span className="block text-[9px] font-bold uppercase tracking-[0.14em] text-[#7A8A82]">Active role</span><span className="block text-sm font-bold text-[#E7EFEA]">Farmer</span></span><ChevronDown className="size-4 text-[#7A8A82]" /></Link></div>
        <nav aria-label="Farmer dashboard" className="flex-1 px-3 py-4">{navigation.map(group => <div key={group.group} className="mb-4"><p className="px-3 pb-2 text-[9px] font-bold uppercase tracking-[0.18em] text-[#596A60]">{group.group}</p><div className="space-y-1">{group.items.map(item => <button key={item.id} type="button" onClick={() => selectSection(item.id)} aria-current={activeSection === item.id ? 'page' : undefined} className={`group flex min-h-10 w-full items-center gap-3 border-l-2 px-3 text-left text-xs font-semibold transition-colors ${activeSection === item.id ? 'border-[#34D399] bg-[#34D399]/10 text-white' : 'border-transparent text-[#9AA9A0] hover:bg-white/[0.04] hover:text-white'}`}><item.icon aria-hidden="true" className={`size-4 ${activeSection === item.id ? 'text-[#34D399]' : 'text-[#7A8A82] group-hover:text-white'}`} /><span className="flex-1">{item.label}</span>{item.id === 'livestock' && <span className="rounded-full bg-[#34D399]/15 px-2 py-0.5 text-[9px] font-bold text-[#6EE7B7]">{animals.length}</span>}</button>)}</div></div>)}</nav>
        <div className="border-t border-white/[0.07] p-3"><div className="mb-2 flex items-center gap-2 rounded-md border border-[#34D399]/20 bg-[#34D399]/[0.06] px-3 py-2 text-[10px] font-bold text-[#6EE7B7]"><ShieldCheck className="size-3.5" /> Secure account</div><div className="truncate px-2 pb-2 text-[10px] text-[#829189]">{email}</div><button type="button" onClick={handleLogout} className="flex min-h-10 w-full items-center gap-3 rounded-md border border-[#2A4033] px-3 text-xs font-semibold text-[#C4D0C9] hover:border-[#FB7185]/40 hover:text-[#FDA4AF]"><LogOut className="size-4" /> Sign out</button></div>
      </aside>

      <div className="min-h-dvh min-w-0 lg:pl-[264px]">
        <header className="sticky top-0 z-30 flex min-h-[64px] items-center gap-3 border-b border-[#1F3429] bg-[#0D1913]/95 px-3 backdrop-blur sm:px-5 lg:px-7">
          <button type="button" aria-label="Open navigation" onClick={() => setSidebarOpen(true)} className="flex size-9 shrink-0 items-center justify-center rounded-md border border-[#24372D] text-[#C4D0C9] hover:text-white lg:hidden"><Menu className="size-4" /></button>
          <div className={`${mobileSearchOpen ? 'flex' : 'hidden'} relative min-w-0 flex-1 md:flex`}><Search aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#718178]" /><input value={search} onChange={event => setSearch(event.target.value)} onKeyDown={handleSearchKeyDown} placeholder="Search herd, listings, services…" className="h-10 w-full rounded-md border border-[#24372D] bg-[#111D18] pl-9 pr-3 text-xs text-[#E7EFEA] outline-none placeholder:text-[#718178] focus:border-[#34D399]" /></div>
          <button type="button" aria-label="Toggle search" onClick={() => setMobileSearchOpen(value => !value)} className="flex size-9 shrink-0 items-center justify-center rounded-md border border-[#24372D] text-[#C4D0C9] hover:text-white md:hidden"><Search className="size-4" /></button>
          <div className="hidden items-center gap-2 rounded-md border border-[#24372D] bg-[#111D18] px-3 py-2 text-[10px] text-[#AAB7AF] sm:flex"><CloudSun className="size-4 text-[#67E8F9]" /><span><strong className="text-[#E7EFEA]">24°C</strong> · Kericho</span></div>
          <div className="ml-auto flex shrink-0 items-center gap-2"><button type="button" onClick={() => notify('Messages will connect when the community service is configured.')} aria-label="Messages" className="relative flex size-9 items-center justify-center rounded-md border border-[#24372D] bg-[#111D18] text-[#9AA9A0] hover:text-white"><MessageCircle className="size-4" /><span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-[#F97362] px-1 text-center text-[9px] font-bold text-white">3</span></button><button type="button" onClick={() => notify('You are all caught up on sample notifications.')} aria-label="Notifications" className="relative flex size-9 items-center justify-center rounded-md border border-[#24372D] bg-[#111D18] text-[#9AA9A0] hover:text-white"><Bell className="size-4" /><span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-[#F97362] px-1 text-center text-[9px] font-bold text-white">4</span></button><button type="button" onClick={() => selectSection('profile')} aria-label="Open profile" className="flex size-9 items-center justify-center rounded-md bg-gradient-to-br from-[#34D399] to-[#F3C96A] text-xs font-black text-[#0A1410]">{displayName.slice(0, 2).toUpperCase()}</button></div>
        </header>

        <main className="mx-auto w-full max-w-[1500px] min-w-0 px-3 py-5 sm:px-5 sm:py-6 lg:px-7 lg:py-8">
          <div className="mb-4 flex items-center justify-between gap-3 rounded-md border border-[#F3C96A]/20 bg-[#F3C96A]/[0.06] px-3 py-2 text-[10px] text-[#C4D0C9]"><span className="flex items-center gap-2"><Sparkles className="size-3.5 text-[#F3C96A]" /> Account dashboard</span><span className="hidden sm:inline">Animal records save to your account; other preview panels are not connected yet.</span></div>
          {activeSection === 'overview' && renderOverview()}
          {activeSection === 'livestock' && renderLivestock()}
          {activeSection === 'marketplace' && renderMarketplace()}
          {activeSection === 'vet' && renderVet()}
          {activeSection === 'finance' && renderFinance()}
          {activeSection === 'analytics' && renderAnalytics()}
          {activeSection === 'community' && renderCommunity()}
          {activeSection === 'profile' && renderProfile()}
          {activeSection === 'settings' && renderSettings()}
          <footer className="mt-10 flex flex-col justify-between gap-2 border-t border-[#1F3429] pt-4 text-[10px] text-[#718178] sm:flex-row"><span>Olerai Ranchly · Farmer workspace</span><span>Sample data · Connected services require setup</span></footer>
        </main>
      </div>

      {addAnimalOpen && (
        <AddAnimalDialog
          animalToEdit={animalToEdit}
          onClose={() => {
            setAddAnimalOpen(false);
            setAnimalToEdit(null);
          }}
          onSaved={handleAnimalSaved}
        />
      )}
      {renderDialog()}
      {toast && <div role="status" aria-live="polite" className="fixed bottom-5 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-2 rounded-md border border-[#34D399]/30 bg-[#10231A] px-4 py-3 text-xs font-semibold text-[#E7EFEA] shadow-2xl"><Check className="size-4 text-[#34D399]" />{toast}</div>}
    </div>
  );
}

function MetricCard({ label, value, detail, icon: Icon, tone }: { label: string; value: string; detail: string; icon: LucideIcon; tone: 'green' | 'amber' | 'cyan' | 'blue' }) {
  const colors = { green: 'text-[#6EE7B7] bg-[#34D399]/10 border-[#34D399]/20', amber: 'text-[#FCD34D] bg-[#FBBF24]/10 border-[#FBBF24]/20', cyan: 'text-[#67E8F9] bg-[#22D3EE]/10 border-[#22D3EE]/20', blue: 'text-[#93C5FD] bg-[#60A5FA]/10 border-[#60A5FA]/20' };
  return <article className="relative overflow-hidden rounded-lg border border-[#24372D] bg-[#111D18] p-4 sm:p-5"><span aria-hidden="true" className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-[#34D399]/70 to-transparent" /><div className="mb-4 flex items-start justify-between gap-2"><p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#829189] sm:text-[10px]">{label}</p><span className={`flex size-8 items-center justify-center rounded-md border ${colors[tone]}`}><Icon aria-hidden="true" className="size-4" /></span></div><p className="text-2xl font-black leading-none tracking-tight text-[#F0F5F2] sm:text-[1.7rem]">{value}</p><p className="mt-2 text-[10px] leading-snug text-[#829189]">{detail}</p></article>;
}

function QuickAction({
  icon: Icon,
  title,
  note,
  highlights,
  actionLabel,
  tone,
  onClick,
}: {
  icon: LucideIcon;
  title: string;
  note: string;
  highlights?: string[];
  actionLabel: string;
  tone: 'green' | 'amber' | 'cyan' | 'blue' | 'gold';
  onClick: () => void;
}) {
  const color = {
    green: 'bg-[#34D399]/10 text-[#6EE7B7] border-[#34D399]/25 group-hover:bg-[#34D399]/20 group-hover:border-[#34D399]/50',
    amber: 'bg-[#FBBF24]/10 text-[#FCD34D] border-[#FBBF24]/25 group-hover:bg-[#FBBF24]/20 group-hover:border-[#FBBF24]/50',
    cyan: 'bg-[#22D3EE]/10 text-[#67E8F9] border-[#22D3EE]/25 group-hover:bg-[#22D3EE]/20 group-hover:border-[#22D3EE]/50',
    blue: 'bg-[#60A5FA]/10 text-[#93C5FD] border-[#60A5FA]/25 group-hover:bg-[#60A5FA]/20 group-hover:border-[#60A5FA]/50',
    gold: 'bg-[#F3C96A]/10 text-[#F3C96A] border-[#F3C96A]/25 group-hover:bg-[#F3C96A]/20 group-hover:border-[#F3C96A]/50',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex min-h-[360px] w-full min-w-0 flex-col justify-between rounded-2xl border border-[#24372D] bg-[#111D18] p-6 text-left transition-all duration-200 hover:-translate-y-1.5 hover:border-[#3B5546] hover:bg-[#14231C] hover:shadow-2xl sm:min-h-[400px] sm:p-8 lg:min-h-[440px] lg:p-9"
    >
      <div>
        <div className="flex w-full items-start justify-between gap-4">
          <span className={`flex size-16 items-center justify-center rounded-xl border transition-all duration-200 group-hover:scale-105 sm:size-[4.5rem] ${color[tone]}`}>
            <Icon className="size-8 sm:size-9" />
          </span>
          <span className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-[#829189] transition-all group-hover:border-[#34D399]/40 group-hover:bg-[#34D399]/15 group-hover:text-[#34D399]">
            <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </div>

        <div className="mt-5 sm:mt-6">
          <span className="block text-lg font-bold text-[#F0F5F2] transition-colors group-hover:text-white sm:text-xl lg:text-2xl">
            {title}
          </span>
          <p className="mt-2.5 text-sm leading-relaxed text-[#9AA9A0] sm:text-base">
            {note}
          </p>
        </div>

        {highlights && highlights.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {highlights.map((item) => (
              <span
                key={item}
                className="rounded-md border border-[#24372D] bg-[#0B1511] px-2.5 py-1 text-[10px] font-semibold text-[#AEBBB3] sm:text-[11px]"
              >
                {item}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 border-t border-[#24372D]/80 pt-4">
        <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[#34D399] transition-all group-hover:gap-2.5 group-hover:text-[#6EE7B7] sm:text-base">
          {actionLabel} <ArrowRight className="size-4" />
        </span>
      </div>
    </button>
  );
}

function AnimalPhotoThumb({ photoPath, species, className = '' }: { photoPath: string | null; species: string; className?: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const icons: Record<string, string> = { Cow: '🐄', Cattle: '🐄', Goat: '🐐', Sheep: '🐑', Pig: '🐖' };

  useEffect(() => {
    let active = true;
    if (photoPath) {
      void getAnimalPhotoSignedUrl(photoPath).then((signed) => {
        if (active && signed) setUrl(signed);
      });
    }
    return () => {
      active = false;
    };
  }, [photoPath]);

  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt="" className={`size-full object-cover rounded-md ${className}`} />
    );
  }

  return <span>{icons[species] ?? '🐾'}</span>;
}

function AnimalCard({
  animal,
  milkLitres,
  medicineCount,
  onDetails,
  onEdit,
  onDelete,
  onAddMilk,
  onAddMedicine,
}: {
  animal: Animal;
  milkLitres: number;
  medicineCount: number;
  onDetails: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddMilk: () => void;
  onAddMedicine: () => void;
}) {
  return (
    <article className="overflow-hidden rounded-lg border border-[#24372D] bg-[#111D18]">
      <div className="flex items-start justify-between gap-3 border-b border-[#24372D] bg-gradient-to-br from-[#10261B] to-[#111D18] p-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-[#34D399]/20 bg-[#34D399]/[0.07] text-2xl">
            <AnimalPhotoThumb photoPath={animal.photoPath} species={animal.species} />
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-bold text-[#E7EFEA]">{animal.name}</h2>
            <p className="mt-1 truncate text-[10px] text-[#829189]">
              <span className="font-mono text-[#6EE7B7]">{animal.tagNumber}</span> · {animal.breed}
            </p>
          </div>
        </div>
        <span className={`shrink-0 rounded-full border px-2 py-1 text-[9px] font-bold ${getStatusStyle(animal.status)}`}>
          {animal.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 p-4">
        {[
          ['Tag', animal.tagNumber],
          ['Age', animal.age],
          ['Weight', animal.weight],
          ['Milk', milkLitres ? `${milkLitres.toLocaleString('en-KE')} L` : '—'],
          ['Purpose', animal.purpose || 'Not set'],
          ['Medicine', medicineCount ? `${medicineCount} record${medicineCount === 1 ? '' : 's'}` : 'None'],
        ].map(([label, value]) => (
          <div key={label} className="rounded-md bg-[#0B1511] p-2">
            <p className="text-[8px] font-bold uppercase tracking-wide text-[#718178]">{label}</p>
            <p className="mt-1 truncate text-[11px] font-semibold text-[#D4DED8]">{value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1.5 border-t border-[#24372D] p-3">
        <button
          type="button"
          onClick={onDetails}
          className="min-h-9 flex-1 rounded-md bg-[#34D399] px-3 text-[10px] font-bold text-[#07150F] transition-colors hover:bg-[#6EE7B7]"
        >
          Details
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="flex size-9 items-center justify-center rounded-md border border-[#2A4033] text-[#C4D0C9] transition-colors hover:border-[#34D399] hover:text-[#6EE7B7]"
          title="Edit animal"
        >
          <Pencil className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="flex size-9 items-center justify-center rounded-md border border-[#2A4033] text-[#C4D0C9] transition-colors hover:border-[#FB7185]/40 hover:text-[#FDA4AF]"
          title="Delete animal"
        >
          <Trash2 className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={onAddMilk}
          className="flex size-9 items-center justify-center rounded-md border border-[#22D3EE]/25 text-[#67E8F9] transition-colors hover:border-[#22D3EE]/60 hover:bg-[#22D3EE]/10"
          title="Add milk record"
        >
          <Milk className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={onAddMedicine}
          className="flex size-9 items-center justify-center rounded-md border border-[#FB7185]/25 text-[#FDA4AF] transition-colors hover:border-[#FB7185]/60 hover:bg-[#FB7185]/10"
          title="Add medicine record"
        >
          <Pill className="size-3.5" />
        </button>
      </div>
    </article>
  );
}

function AnimalDetailsModal({
  animal,
  onClose,
  onEdit,
  onDelete,
  onAddMilk,
  onAddMedicine,
  milkRecords,
  medicineRecords,
}: {
  animal: Animal;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddMilk: () => void;
  onAddMedicine: () => void;
  milkRecords: MilkRecord[];
  medicineRecords: MedicineRecord[];
}) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const animalMilk = milkRecords
    .filter((record) => record.animalId === animal.id)
    .sort((a, b) => b.recordedOn.localeCompare(a.recordedOn))
    .slice(0, 12);
  const animalMeds = medicineRecords
    .filter((record) => record.animalId === animal.id)
    .sort((a, b) => b.givenOn.localeCompare(a.givenOn))
    .slice(0, 12);
  const milkTotal = milkRecords
    .filter((record) => record.animalId === animal.id)
    .reduce((sum, record) => sum + record.amountLitres, 0);
  const medTotal = medicineRecords
    .filter((record) => record.animalId === animal.id)
    .reduce((sum, record) => sum + (record.costKsh ?? 0), 0);
  const hasMilk = animalMilk.length > 0;
  const hasMeds = animalMeds.length > 0;

  useEffect(() => {
    let active = true;
    if (animal.photoPath) {
      void getAnimalPhotoSignedUrl(animal.photoPath).then((url) => {
        if (active && url) setPhotoUrl(url);
      });
    }
    return () => {
      active = false;
    };
  }, [animal.photoPath]);

  return (
    <div
      className="fixed inset-0 z-[80] grid place-items-center overflow-y-auto bg-black/80 p-3 backdrop-blur-sm sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="details-title"
        className="my-auto w-full max-w-2xl rounded-lg border border-[#2A4033] bg-[#111D18] shadow-2xl"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 rounded-t-lg border-b border-[#24372D] bg-[#111D18]/95 px-5 py-4 backdrop-blur sm:px-7">
          <div className="flex items-center gap-3">
            <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-md border border-[#34D399]/20 bg-[#0B1511] text-3xl">
              <AnimalPhotoThumb photoPath={animal.photoPath} species={animal.species} />
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-[0.16em] text-[#34D399]">
                TAG: <span className="font-mono text-white">{animal.tagNumber}</span>
              </p>
              <h2 id="details-title" className="mt-0.5 text-xl font-bold text-[#F0F5F2]">
                {animal.name}
              </h2>
              <p className="text-xs text-[#829189]">
                {animal.breed} · {animal.species} ({animal.sex})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            aria-label="Close details"
            className="flex size-9 items-center justify-center rounded-md border border-[#2A4033] text-[#9AA9A0] hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="max-h-[calc(85dvh-120px)] space-y-5 overflow-y-auto p-5 sm:p-7">
          {/* Photo banner if available */}
          {photoUrl && (
            <div className="overflow-hidden rounded-md border border-[#24372D]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoUrl} alt={animal.name} className="h-56 w-full object-cover" />
            </div>
          )}

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <DetailMetric label="Status" value={animal.status} highlight />
            <DetailMetric label="Ownership" value={animal.ownershipType || 'Owned'} />
            <DetailMetric label="Age" value={animal.age} />
            <DetailMetric label="Purpose" value={animal.purpose || 'Not set'} />
          </div>

          {/* Identity details */}
          <section className="rounded-md border border-[#24372D] bg-[#0B1511] p-4">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#34D399]">Animal Identity</h3>
            <div className="grid gap-2 text-xs sm:grid-cols-2">
              <DetailRow label="Tag Number" value={animal.tagNumber} />
              <DetailRow label="Name" value={animal.name} />
              <DetailRow label="Type / Species" value={`${animal.animalType || animal.species}${animal.otherAnimalType ? ` (${animal.otherAnimalType})` : ''}`} />
              <DetailRow label="Breed" value={animal.breed} />
              <DetailRow label="Sex" value={animal.sex} />
              <DetailRow label="Color / Markings" value={animal.colorMarkings || animal.color || 'Not recorded'} />
              <DetailRow label="Lifecycle Status" value={animal.animalStatus || 'Active'} />
              <DetailRow label="Milk Records" value={hasMilk ? `${animalMilk.length} logged · ${milkTotal.toLocaleString('en-KE')} L total` : 'None logged'} />
            </div>
          </section>

          {/* Acquisition details */}
          <section className="rounded-md border border-[#24372D] bg-[#0B1511] p-4">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#34D399]">
              Acquisition ({animal.acquisitionMethod})
            </h3>
            <div className="grid gap-2 text-xs sm:grid-cols-2">
              {animal.acquisitionMethod === 'Born on Farm' && (
                <>
                  <DetailRow label="Date of Birth" value={animal.dateOfBirth || 'Not recorded'} />
                  <DetailRow label="Birth Type" value={animal.birthType || 'Single'} />
                  <DetailRow label="Birth Weight" value={animal.birthWeightKg !== null ? `${animal.birthWeightKg} kg` : 'Not recorded'} />
                  <DetailRow label="Mother / Dam Tag" value={animal.motherDamTag || 'Not recorded'} />
                  <DetailRow label="Father / Sire Tag" value={animal.fatherSireTag || 'Not recorded'} />
                </>
              )}
              {animal.acquisitionMethod === 'Bought' && (
                <>
                  <DetailRow label="Purchase Date" value={animal.purchaseDate || 'Not recorded'} />
                  <DetailRow label="Purchase Price" value={animal.purchasePriceKsh ? `KSh ${animal.purchasePriceKsh.toLocaleString('en-KE')}` : 'Not recorded'} />
                  <DetailRow label="Age at Purchase" value={animal.ageAtPurchase || 'Not recorded'} />
                  <DetailRow label="Seller Name" value={animal.sellerName || 'Not recorded'} />
                  <DetailRow label="Seller Phone" value={animal.sellerPhone || 'Not recorded'} />
                  <DetailRow label="Location" value={animal.purchaseLocation || 'Not recorded'} />
                </>
              )}
              {animal.acquisitionMethod === 'Consigned/Received' && (
                <>
                  <DetailRow label="Consignment Owner" value={animal.consignmentOwnerName || 'Not recorded'} />
                  <DetailRow label="Owner Phone" value={animal.consignmentOwnerPhone || 'Not recorded'} />
                  <DetailRow label="Date Received" value={animal.dateReceived || 'Not recorded'} />
                  <DetailRow label="Expected Return" value={animal.expectedReturnDate || 'Not set'} />
                  <DetailRow label="Reason" value={animal.consignmentReason || 'Not recorded'} />
                </>
              )}
            </div>
          </section>

          {/* Breeding details (if female) */}
          {animal.sex === 'Female' && (
            <section className="rounded-md border border-[#24372D] bg-[#0B1511] p-4">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#34D399]">Breeding Record</h3>
              <div className="grid gap-2 text-xs sm:grid-cols-2">
                <DetailRow label="Breeding Status" value={animal.breedingStatus || 'Unknown'} />
                <DetailRow label="First Breeding Date" value={animal.firstBreedingDate || 'Not recorded'} />
                <DetailRow label="Last Mating / AI Date" value={animal.lastMatingDate || 'Not recorded'} />
                <DetailRow label="Expected Delivery" value={animal.expectedDeliveryDate || 'Not set'} />
                <div className="sm:col-span-2">
                  <DetailRow label="Breeding Notes" value={animal.breedingNotes || 'None'} />
                </div>
              </div>
            </section>
          )}

          {/* Health details */}
          <section className="rounded-md border border-[#24372D] bg-[#0B1511] p-4">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#34D399]">Health & Preventative Care</h3>
            <div className="grid gap-2 text-xs sm:grid-cols-2">
              <DetailRow label="Health Status" value={animal.healthStatus || animal.status} />
              <DetailRow label="Last Vaccination" value={animal.vaccinationDate || 'Not recorded'} />
              <DetailRow label="Next Vaccination" value={animal.nextVaccinationDate || 'Not scheduled'} />
              <DetailRow label="Last Deworming" value={animal.dewormingDate || 'Not recorded'} />
              <DetailRow label="Next Deworming" value={animal.nextDewormingDate || 'Not scheduled'} />
              <div className="sm:col-span-2">
                <DetailRow label="Health Notes" value={animal.healthNotes || 'None'} />
              </div>
            </div>
          </section>

          {/* Additional notes */}
          {animal.additionalNotes && (
            <section className="rounded-md border border-[#24372D] bg-[#0B1511] p-4">
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-[#34D399]">Additional Notes</h3>
              <p className="text-xs leading-relaxed text-[#C4D0C9]">{animal.additionalNotes}</p>
            </section>
          )}

          {/* Milk production history */}
          <section className="rounded-md border border-[#24372D] bg-[#0B1511] p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#67E8F9]">
                <Milk className="size-4" /> Milk production
                {milkTotal > 0 && (
                  <span className="rounded-full border border-[#22D3EE]/25 bg-[#22D3EE]/10 px-2 py-0.5 text-[9px] font-bold text-[#67E8F9]">
                    {milkTotal.toLocaleString('en-KE')} L total
                  </span>
                )}
              </h3>
              <button
                type="button"
                onClick={onAddMilk}
                className="inline-flex items-center gap-1 rounded-md border border-[#22D3EE]/30 px-2 py-1 text-[9px] font-bold text-[#67E8F9] transition-colors hover:bg-[#22D3EE]/10"
              >
                <Plus className="size-3" /> Add milk
              </button>
            </div>
            {hasMilk ? (
              <div className="divide-y divide-white/[0.04]">
                {animalMilk.map((record) => (
                  <div key={record.id} className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold text-[#E7EFEA]">
                        {record.recordedOn} · {record.session}
                      </span>
                      {record.notes && (
                        <span className="mt-0.5 block text-[10px] text-[#829189]">{record.notes}</span>
                      )}
                    </span>
                    <span className="shrink-0 font-mono text-sm font-bold text-[#6EE7B7]">
                      {record.amountLitres} L
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#829189]">No milk records yet for this animal.</p>
            )}
          </section>

          {/* Medicine & treatment history */}
          <section className="rounded-md border border-[#24372D] bg-[#0B1511] p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FDA4AF]">
                <Pill className="size-4" /> Medicine & treatment
                {medTotal > 0 && (
                  <span className="rounded-full border border-[#FB7185]/25 bg-[#FB7185]/10 px-2 py-0.5 text-[9px] font-bold text-[#FDA4AF]">
                    KSh {medTotal.toLocaleString('en-KE')}
                  </span>
                )}
              </h3>
              <button
                type="button"
                onClick={onAddMedicine}
                className="inline-flex items-center gap-1 rounded-md border border-[#FB7185]/30 px-2 py-1 text-[9px] font-bold text-[#FDA4AF] transition-colors hover:bg-[#FB7185]/10"
              >
                <Plus className="size-3" /> Add medicine
              </button>
            </div>
            {hasMeds ? (
              <div className="divide-y divide-white/[0.04]">
                {animalMeds.map((record) => (
                  <div key={record.id} className="py-2.5 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-3">
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-semibold text-[#E7EFEA]">
                          {record.medicineName}
                        </span>
                        <span className="mt-0.5 block text-[10px] text-[#829189]">
                          {record.givenOn} · {record.category}
                          {record.dosage ? ` · ${record.dosage}${record.dosageUnit ? ` ${record.dosageUnit}` : ''}` : ''}
                        </span>
                        {record.administeredBy && (
                          <span className="mt-0.5 block text-[10px] text-[#829189]">
                            Administered by {record.administeredBy}
                          </span>
                        )}
                      </span>
                      {record.costKsh !== null && record.costKsh > 0 && (
                        <span className="shrink-0 font-mono text-xs font-bold text-[#FDA4AF]">
                          KSh {record.costKsh.toLocaleString('en-KE')}
                        </span>
                      )}
                    </div>
                    {record.nextDueDate && (
                      <span className="mt-1.5 inline-flex rounded border border-[#F3C96A]/25 bg-[#F3C96A]/10 px-2 py-0.5 text-[9px] font-semibold text-[#F3C96A]">
                        Next due: {record.nextDueDate}
                      </span>
                    )}
                    {record.notes && <p className="mt-1.5 text-[10px] text-[#9AA9A0]">{record.notes}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#829189]">No medicine or treatment records yet for this animal.</p>
            )}
          </section>
        </div>

        {/* Modal footer actions */}
        <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-2 border-t border-[#24372D] bg-[#111D18]/95 px-5 py-3 backdrop-blur sm:px-7">
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-md border border-[#FB7185]/30 px-3 text-xs font-semibold text-[#FDA4AF] transition-colors hover:bg-[#FB7185]/10"
          >
            <Trash2 className="size-3.5" /> Delete
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-10 rounded-md border border-[#2A4033] px-4 text-xs font-semibold text-[#C4D0C9] hover:border-zinc-500"
            >
              Close
            </button>
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-md bg-[#34D399] px-4 text-xs font-bold text-[#07150F] transition-colors hover:bg-[#6EE7B7]"
            >
              <Pencil className="size-3.5" /> Edit animal
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function DetailMetric({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-md border border-[#24372D] bg-[#0B1511] p-2.5">
      <p className="text-[9px] font-bold uppercase tracking-wider text-[#718178]">{label}</p>
      <p className={`mt-1 truncate text-xs font-bold ${highlight ? 'text-[#34D399]' : 'text-[#E7EFEA]'}`}>{value}</p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-white/[0.04] py-1.5 last:border-0">
      <span className="text-[#829189]">{label}:</span>
      <span className="font-semibold text-[#E7EFEA] text-right">{value}</span>
    </div>
  );
}

function ListingCard({ listing, onView }: { listing: MarketplaceListing; onView: () => void }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-lg border border-[#24372D] bg-[#111D18] transition-colors hover:border-[#34D399]/40">
      <div className="flex items-start justify-between gap-3 border-b border-[#24372D] bg-gradient-to-br from-[#10261B] to-[#111D18] p-4">
        <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[9px] font-bold ${listingCategoryTone(listing.category)}`}>
          {listingCategoryIcon(listing.category)} {listing.category}
        </span>
        <span className={`shrink-0 rounded-full border px-2 py-1 text-[9px] font-bold ${listing.negotiable ? 'border-[#F59E0B]/25 bg-[#F59E0B]/10 text-[#FCD34D]' : 'border-[#24372D] bg-[#0B1511] text-[#718178]'}`}>
          {listing.negotiable ? 'Negotiable' : 'Fixed price'}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h2 className="truncate text-sm font-bold text-[#E7EFEA]">{listing.title}</h2>
        <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-[#829189]">
          {listingSummary(listing)}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-[#9AA9A0]">
          <span className="inline-flex items-center gap-1"><MapPin className="size-3 text-[#67E8F9]" /> {listing.locationCounty}</span>
          <span>{listing.contactName || 'Verified farmer'}</span>
        </div>

        <p className="mt-4 font-mono text-lg font-bold text-[#6EE7B7]">{formatKsh(listing.priceKsh)}</p>

        <button type="button" onClick={onView} className="mt-4 min-h-9 rounded-md bg-[#34D399] text-[10px] font-bold text-[#07150F] transition-colors hover:bg-[#6EE7B7]">
          View listing
        </button>
      </div>
    </article>
  );
}

function ListingDetailsModal({ listing, canManage, onClose, onDelete }: {
  listing: MarketplaceListing;
  canManage: boolean;
  onClose: () => void;
  onDelete?: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[90] grid place-items-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={listing.title}
        className="my-auto w-full max-w-lg rounded-lg border border-[#2A4033] bg-[#111D18] shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#24372D] px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-md border border-[#2A4033] text-[#6EE7B7]">
              {listingCategoryIcon(listing.category)}
            </span>
            <div>
              <p className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[9px] font-bold ${listingCategoryTone(listing.category)}`}>
                {listing.category}
              </p>
              <h2 className="mt-1.5 text-lg font-bold text-[#F0F5F2]">{listing.title}</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close listing details"
            className="flex size-9 shrink-0 items-center justify-center rounded-md border border-[#2A4033] text-[#9AA9A0] hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-5 px-5 py-5 sm:px-6">
          <div className="grid grid-cols-2 gap-3">
            <DetailMetric label="Price" value={formatKsh(listing.priceKsh)} highlight />
            <DetailMetric label="Posted" value={formatRelativeTime(new Date(listing.createdAt).getTime())} />
            <DetailMetric label="County" value={listing.locationCounty} />
            <DetailMetric label="Price type" value={listing.negotiable ? 'Negotiable' : 'Fixed'} />
          </div>

          <div>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-[#34D399]">Description</h3>
            <p className="text-sm leading-relaxed text-[#C4D0C9]">{listing.description || 'No description added.'}</p>
          </div>

          {LISTING_ATTR_FIELDS[listing.category].some((field) => listing.attributes?.[field.key]) && (
            <div className="rounded-md border border-[#24372D] bg-[#0B1511] p-4">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#34D399]">Specifications</h3>
              <div className="grid gap-2 text-xs sm:grid-cols-2">
                {LISTING_ATTR_FIELDS[listing.category].map((field) => {
                  const value = listing.attributes?.[field.key];
                  if (!value) return null;
                  const label = field.label.replace(/\s*\(.*\)\s*$/, '');
                  return <DetailRow key={field.key} label={label} value={value} />;
                })}
              </div>
            </div>
          )}

          <div className="rounded-md border border-[#24372D] bg-[#0B1511] p-4">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#34D399]">Seller details</h3>
            <div className="grid gap-2 text-xs sm:grid-cols-2">
              <DetailRow label="Contact person" value={listing.contactName || 'Farmer'} />
              <DetailRow label="Phone" value={listing.contactPhone || 'Contact via marketplace'} />
              <DetailRow label="Location" value={listing.locationCounty} />
              <DetailRow label="Posted" value={formatRelativeTime(new Date(listing.createdAt).getTime())} />
            </div>
            {listing.contactPhone && (
              <a
                href={`tel:${listing.contactPhone.replace(/[^+0-9]/g, '')}`}
                className="mt-4 inline-flex min-h-9 items-center gap-2 rounded-md bg-[#34D399] px-4 text-xs font-bold text-[#07150F] transition-colors hover:bg-[#6EE7B7]"
              >
                <Phone className="size-3.5" /> Call seller
              </a>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-2 border-t border-[#24372D] bg-[#111D18]/95 px-5 py-3 backdrop-blur sm:px-6">
          {canManage ? (
            <button
              type="button"
              onClick={onDelete}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-md border border-[#FB7185]/30 px-3 text-xs font-semibold text-[#FDA4AF] transition-colors hover:bg-[#FB7185]/10"
            >
              <Trash2 className="size-3.5" /> Remove listing
            </button>
          ) : <span />}
          <button
            type="button"
            onClick={onClose}
            className="min-h-10 rounded-md border border-[#2A4033] px-4 text-xs font-semibold text-[#C4D0C9] hover:border-zinc-500"
          >
            Close
          </button>
        </div>
      </section>
    </div>
  );
}

function PostListingDialog({ defaultCounty, onClose, onCreated }: {
  defaultCounty: string;
  onClose: () => void;
  onCreated: (listing: MarketplaceListing) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [category, setCategory] = useState<ListingCategory>('Livestock');
  const [negotiable, setNegotiable] = useState(false);
  const [attributes, setAttributes] = useState<Record<string, string>>({});

  const setAttr = (key: string, value: string) => {
    setAttributes((current) => {
      const next = { ...current };
      if (value.trim()) next[key] = value.trim();
      else delete next[key];
      return next;
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    const formData = new FormData(event.currentTarget);
    const title = String(formData.get('title') ?? '').trim();
    const description = String(formData.get('description') ?? '').trim() || null;
    const priceRaw = String(formData.get('price_ksh') ?? '').trim();
    const price = Number(priceRaw);
    const locationCounty = String(formData.get('location_county') ?? '') || 'Other';
    const contactName = String(formData.get('contact_name') ?? '').trim() || null;
    const contactPhone = String(formData.get('contact_phone') ?? '').trim() || null;

    if (!title) {
      setError('Give your listing a short, clear title.');
      return;
    }
    if (!priceRaw || !Number.isFinite(price) || price < 0) {
      setError('Enter a valid asking price in KSh.');
      return;
    }
    setSaving(true);
    try {
      const listing = await createMarketplaceListing({
        category,
        title,
        description,
        price_ksh: price,
        negotiable,
        attributes,
        location_county: locationCounty,
        contact_name: contactName,
        contact_phone: contactPhone,
      });
      onCreated(listing);
    } catch (cause) {
      setError(cause instanceof MarketplaceDataError ? cause.message : 'We could not post your listing. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[90] grid place-items-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Post a listing"
        className="w-full max-w-lg rounded-lg border border-[#2A4033] bg-[#111D18] p-5 shadow-2xl sm:p-6"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#F59E0B]/15 text-[#FCD34D]">
              <ShoppingBag className="size-5" />
            </span>
            <div>
              <p className="text-[10px] font-bold tracking-[0.16em] text-[#F59E0B]">MARKETPLACE</p>
              <h2 className="mt-0.5 text-xl font-bold text-[#F0F5F2]">Post a listing</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="flex size-9 items-center justify-center rounded-md border border-[#2A4033] text-[#9AA9A0] hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <span className="text-xs font-semibold text-[#C4D0C9]">Category</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {LISTING_CATEGORIES.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setCategory(option)}
                  className={`inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors ${category === option
                    ? 'border-[#F59E0B]/60 bg-[#F59E0B]/15 text-[#FCD34D]'
                    : 'border-[#2A4033] bg-[#0B1511] text-[#9AA9A0] hover:text-white'}`}
                >
                  <span className="text-[#718178]">{listingCategoryIcon(option)}</span>
                  {option}
                </button>
              ))}
            </div>
          </div>

          <label className="block text-xs font-semibold text-[#C4D0C9]">
            Title
            <input
              name="title"
              type="text"
              required
              maxLength={120}
              placeholder="e.g. Friesian heifer, 18 months"
              className="mt-2 h-10 w-full rounded-md border border-[#2A4033] bg-[#0B1511] px-3 text-sm font-normal text-[#E7EFEA] outline-none placeholder:text-[#596A60] focus:border-[#F59E0B]"
            />
          </label>

          <div className="rounded-md border border-[#F59E0B]/15 bg-[#F59E0B]/[0.04] p-3.5">
            <span className="text-[10px] font-bold tracking-[0.14em] text-[#F59E0B]">KEY DETAILS · {category.toUpperCase()}</span>
            {category === 'Other' ? (
              <p className="mt-2 text-xs text-[#829189]">Describe everything about your item freely in the description below.</p>
            ) : (
              <>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {LISTING_ATTR_FIELDS[category].map((field) => (
                    <label key={field.key} className="block text-xs font-semibold text-[#C4D0C9]">
                      {field.label}
                      {field.options ? (
                        <select
                          value={attributes[field.key] ?? ''}
                          onChange={(event) => setAttr(field.key, event.target.value)}
                          className="mt-2 h-10 w-full rounded-md border border-[#2A4033] bg-[#0B1511] px-3 text-sm font-normal text-[#E7EFEA] outline-none focus:border-[#F59E0B]"
                        >
                          <option value="">Choose {field.label.toLowerCase()}…</option>
                          {field.options.map((option) => <option key={option} value={option}>{option}</option>)}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={attributes[field.key] ?? ''}
                          onChange={(event) => setAttr(field.key, event.target.value)}
                          placeholder={field.placeholder}
                          className="mt-2 h-10 w-full rounded-md border border-[#2A4033] bg-[#0B1511] px-3 text-sm font-normal text-[#E7EFEA] outline-none placeholder:text-[#596A60] focus:border-[#F59E0B]"
                        />
                      )}
                    </label>
                  ))}
                </div>
                <p className="mt-3 flex items-center gap-1.5 text-[11px] text-[#829189]">
                  <Sparkles className="size-3.5 text-[#F59E0B]" />
                  <span key={category}>Preview: <span className="font-semibold text-[#FCD34D]">{LISTING_ATTR_FIELDS[category].map((field) => attributes[field.key]).filter(Boolean).join(' · ') || 'Fill in the details above…'}</span></span>
                </p>
              </>
            )}
          </div>

          <label className="block text-xs font-semibold text-[#C4D0C9]">
            Description
            <textarea
              name="description"
              rows={3}
              maxLength={2000}
              className="mt-2 w-full rounded-md border border-[#2A4033] bg-[#0B1511] px-3 py-2 text-sm text-white outline-none focus:border-[#F59E0B]"
              placeholder="Age, breed, weight, health status, packaging, delivery…"
            />
          </label>

          <label className="block text-xs font-semibold text-[#C4D0C9]">
            Asking price (KSh)
            <input
              name="price_ksh"
              type="number"
              min="0"
              step="0.01"
              required
              placeholder="e.g. 85000"
              className="mt-2 h-10 w-full rounded-md border border-[#2A4033] bg-[#0B1511] px-3 text-sm font-normal text-[#E7EFEA] outline-none placeholder:text-[#596A60] focus:border-[#F59E0B]"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-xs font-semibold text-[#C4D0C9]">
              County
              <select name="location_county" defaultValue={defaultCounty} className="mt-2 h-10 w-full rounded-md border border-[#2A4033] bg-[#0B1511] px-3 text-sm font-normal text-[#E7EFEA] outline-none focus:border-[#F59E0B]">
                {KENYA_COUNTIES.map((county) => <option key={county}>{county}</option>)}
              </select>
            </label>
            <label className="block text-xs font-semibold text-[#C4D0C9]">
              Contact person (optional)
              <input
                name="contact_name"
                type="text"
                maxLength={120}
                placeholder="e.g. John Kamau"
                className="mt-2 h-10 w-full rounded-md border border-[#2A4033] bg-[#0B1511] px-3 text-sm font-normal text-[#E7EFEA] outline-none placeholder:text-[#596A60] focus:border-[#F59E0B]"
              />
            </label>
          </div>

          <label className="block text-xs font-semibold text-[#C4D0C9]">
            Contact phone (optional)
            <input
              name="contact_phone"
              type="tel"
              maxLength={20}
              placeholder="e.g. 07XX XXX XXX"
              className="mt-2 h-10 w-full rounded-md border border-[#2A4033] bg-[#0B1511] px-3 text-sm font-normal text-[#E7EFEA] outline-none placeholder:text-[#596A60] focus:border-[#F59E0B]"
            />
          </label>

          <ToggleRow title="Price is negotiable" note="Allow buyers to bargain on this price." checked={negotiable} onChange={setNegotiable} />

          {error && (
            <p role="alert" className="rounded-md border border-[#FB7185]/25 bg-[#FB7185]/[0.07] px-3 py-2 text-xs text-[#FDA4AF]">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 border-t border-[#24372D] pt-4">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="min-h-10 rounded-md border border-[#2A4033] px-4 text-xs font-semibold text-[#C4D0C9] hover:border-zinc-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[#F59E0B] px-4 text-xs font-bold text-[#241505] transition-colors hover:bg-[#FBBF24] disabled:cursor-wait disabled:opacity-60"
            >
              {saving ? 'Posting…' : 'Post listing'} <Check className="size-4" />
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function ProviderCard({ provider, onBook }: { provider: typeof providers[number]; onBook: () => void }) {
  return <article className="rounded-lg border border-[#24372D] bg-[#111D18] p-4"><div className="flex items-start gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-md border border-[#67E8F9]/20 bg-[#67E8F9]/10 text-[#67E8F9]"><Stethoscope className="size-5" /></span><div className="min-w-0"><h2 className="truncate text-sm font-bold text-[#E7EFEA]">{provider.name}</h2><p className="mt-1 text-[10px] text-[#829189]">{provider.specialty}</p></div></div><div className="mt-4 flex justify-between gap-2 text-[10px]"><span className="text-[#9AA9A0]">{provider.location}</span><span className="font-bold text-[#FCD34D]">★ {provider.rating}</span></div><button type="button" onClick={onBook} className="mt-4 min-h-9 w-full rounded-md bg-[#67E8F9]/10 text-xs font-bold text-[#67E8F9] hover:bg-[#67E8F9]/15">Request appointment</button></article>;
}

function PartnerRow({ name, detail, badge, onClick }: { name: string; detail: string; badge: string; onClick: () => void }) {
  return <div className="flex items-center gap-3 border-b border-[#24372D] py-3 last:border-0"><span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-[#34D399]/10 text-[#6EE7B7]"><ShieldCheck className="size-4" /></span><span className="min-w-0 flex-1"><span className="block text-xs font-bold text-[#E7EFEA]">{name}</span><span className="mt-1 block text-[10px] text-[#829189]">{detail}</span></span><button type="button" onClick={onClick} className="shrink-0 rounded-md border border-[#2A4033] px-2.5 py-1.5 text-[9px] font-semibold text-[#D4DED8] hover:border-[#34D399]">{badge}</button></div>;
}

function DistributionRow({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  return <div className="mb-4 last:mb-0"><div className="mb-2 flex justify-between text-xs"><span className="text-[#C4D0C9]">{label}</span><span className="font-mono text-[#9AA9A0]">{value}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-[#24372D]"><div className="h-full rounded-full" style={{ width: `${total ? Math.max(8, value / total * 100) : 0}%`, backgroundColor: color }} /></div></div>;
}

function Field({ label, name, type = 'text', defaultValue, placeholder, required, readOnly, min }: { label: string; name: string; type?: string; defaultValue?: string; placeholder?: string; required?: boolean; readOnly?: boolean; min?: string }) {
  return <label className="block text-xs font-semibold text-[#C4D0C9]">{label}<input name={name} type={type} defaultValue={defaultValue} placeholder={placeholder} required={required} readOnly={readOnly} min={min} className="mt-2 h-10 w-full rounded-md border border-[#2A4033] bg-[#0B1511] px-3 text-sm font-normal text-[#E7EFEA] outline-none placeholder:text-[#596A60] focus:border-[#34D399] read-only:opacity-60" /></label>;
}

function ToggleRow({ title, note, checked, onChange }: { title: string; note: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <div className="flex items-center justify-between gap-4 border-b border-[#24372D] py-3 last:border-0"><span className="min-w-0"><span className="block text-xs font-semibold text-[#E7EFEA]">{title}</span><span className="mt-1 block text-[10px] text-[#829189]">{note}</span></span><button type="button" role="switch" aria-checked={checked} aria-label={title} onClick={() => onChange(!checked)} className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-[#34D399]' : 'bg-[#2A4033]'}`}><span className={`absolute top-1 size-4 rounded-full bg-white transition-all ${checked ? 'left-6' : 'left-1'}`} /></button></div>;
}

function EmptyState({ title, note }: { title: string; note: string }) {
  return <div className="rounded-lg border border-dashed border-[#2A4033] bg-[#111D18]/60 px-5 py-12 text-center"><Search className="mx-auto size-6 text-[#596A60]" /><h2 className="mt-3 text-sm font-bold text-[#D4DED8]">{title}</h2><p className="mt-1 text-xs text-[#829189]">{note}</p></div>;
}

function AddMilkDialog({ animals, defaultAnimalId, onClose, onSaved }: {
  animals: Animal[];
  defaultAnimalId?: string;
  onClose: () => void;
  onSaved: (record: MilkRecord) => void;
}) {
  const [animalId, setAnimalId] = useState(defaultAnimalId ?? '');
  const [session, setSession] = useState<MilkSession>('Morning');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    const formData = new FormData(event.currentTarget);
    const amount = Number(formData.get('amount_litres'));
    const recordedOn = String(formData.get('recorded_on') ?? '');
    const notes = String(formData.get('notes') ?? '').trim() || null;
    if (!animalId) {
      setError('Choose which animal you are logging.');
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Enter a milk amount greater than zero (litres).');
      return;
    }
    if (!recordedOn) {
      setError('Pick the date the milk was collected.');
      return;
    }
    setSaving(true);
    try {
      const record = await createMyMilkRecord(animalId, {
        amount_litres: amount,
        recorded_on: recordedOn,
        session,
        notes,
      });
      onSaved(record);
    } catch (cause) {
      setError(cause instanceof RecordDataError ? cause.message : 'We could not save this milk record.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[90] grid place-items-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Add milk record"
        className="w-full max-w-md rounded-lg border border-[#2A4033] bg-[#111D18] p-5 shadow-2xl sm:p-6"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#22D3EE]/15 text-[#67E8F9]">
              <Milk className="size-5" />
            </span>
            <div>
              <p className="text-[10px] font-bold tracking-[0.16em] text-[#22D3EE]">PRODUCTION LOG</p>
              <h2 className="mt-0.5 text-xl font-bold text-[#F0F5F2]">Add milk record</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            aria-label="Close dialog"
            className="flex size-9 items-center justify-center rounded-md border border-[#2A4033] text-[#9AA9A0] hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-xs font-semibold text-[#C4D0C9]">
            Animal
            <select
              value={animalId}
              onChange={(event) => setAnimalId(event.target.value)}
              required
              className="mt-2 h-10 w-full rounded-md border border-[#2A4033] bg-[#0B1511] px-3 text-sm font-normal text-[#E7EFEA] outline-none focus:border-[#22D3EE]"
            >
              <option value="">Choose an animal…</option>
              {animals.map((animal) => (
                <option key={animal.id} value={animal.id}>
                  {animal.tagNumber} · {animal.name} · {animal.breed}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-xs font-semibold text-[#C4D0C9]">
              Amount (litres)
              <input
                name="amount_litres"
                type="number"
                step="0.1"
                min="0.1"
                required
                placeholder="e.g. 18.5"
                className="mt-2 h-10 w-full rounded-md border border-[#2A4033] bg-[#0B1511] px-3 text-sm font-normal text-[#E7EFEA] outline-none placeholder:text-[#596A60] focus:border-[#22D3EE]"
              />
            </label>
            <label className="block text-xs font-semibold text-[#C4D0C9]">
              Date
              <input
                name="recorded_on"
                type="date"
                required
                defaultValue={dateToday}
                max={dateToday}
                className="mt-2 h-10 w-full rounded-md border border-[#2A4033] bg-[#0B1511] px-3 text-sm font-normal text-[#E7EFEA] outline-none focus:border-[#22D3EE]"
              />
            </label>
          </div>

          <div>
            <span className="text-xs font-semibold text-[#C4D0C9]">Milking session</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {MILK_SESSIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setSession(option)}
                  className={`min-h-9 rounded-full border px-3 text-xs font-semibold transition-colors ${session === option
                    ? 'border-[#22D3EE]/60 bg-[#22D3EE]/15 text-[#67E8F9]'
                    : 'border-[#2A4033] bg-[#0B1511] text-[#9AA9A0] hover:text-white'}`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <label className="block text-xs font-semibold text-[#C4D0C9]">
            Notes
            <textarea
              name="notes"
              rows={3}
              className="mt-2 w-full rounded-md border border-[#2A4033] bg-[#0B1511] px-3 py-2 text-sm text-white outline-none focus:border-[#22D3EE]"
              placeholder="e.g. calf disturbed the morning milking"
            />
          </label>

          {error && (
            <p role="alert" className="rounded-md border border-[#FB7185]/25 bg-[#FB7185]/[0.07] px-3 py-2 text-xs text-[#FDA4AF]">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 border-t border-[#24372D] pt-4">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="min-h-10 rounded-md border border-[#2A4033] px-4 text-xs font-semibold text-[#C4D0C9] hover:border-zinc-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[#22D3EE] px-4 text-xs font-bold text-[#07151A] transition-colors hover:bg-[#67E8F9] disabled:cursor-wait disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save milk record'} <Check className="size-4" />
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function AddMedicineDialog({ animals, defaultAnimalId, onClose, onSaved }: {
  animals: Animal[];
  defaultAnimalId?: string;
  onClose: () => void;
  onSaved: (record: MedicineRecord) => void;
}) {
  const [animalId, setAnimalId] = useState(defaultAnimalId ?? '');
  const [category, setCategory] = useState<MedicineCategory>('Vaccine');
  const [givenOn, setGivenOn] = useState(dateToday);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    const formData = new FormData(event.currentTarget);
    const medicineName = String(formData.get('medicine_name') ?? '').trim();
    const dosage = String(formData.get('dosage') ?? '').trim() || null;
    const dosageUnit = String(formData.get('dosage_unit') ?? '').trim() || null;
    const givenOn = String(formData.get('given_on') ?? '');
    const nextDueDate = String(formData.get('next_due_date') ?? '').trim() || null;
    const costRaw = String(formData.get('cost_ksh') ?? '').trim();
    const costKsh = costRaw ? Number(costRaw) : null;
    const administeredBy = String(formData.get('administered_by') ?? '').trim() || null;
    const notes = String(formData.get('notes') ?? '').trim() || null;
    if (!animalId) {
      setError('Choose which animal received treatment.');
      return;
    }
    if (!medicineName) {
      setError('Enter the medicine or treatment name.');
      return;
    }
    if (!givenOn) {
      setError('Pick the date it was given.');
      return;
    }
    if (costRaw && (!Number.isFinite(costKsh) || (costKsh ?? 0) < 0)) {
      setError('Enter a valid cost in KSh (0 or more).');
      return;
    }
    setSaving(true);
    try {
      const record = await createMyMedicineRecord(animalId, {
        medicine_name: medicineName,
        category,
        dosage,
        dosage_unit: dosageUnit,
        given_on: givenOn,
        next_due_date: nextDueDate,
        cost_ksh: costKsh,
        administered_by: administeredBy,
        notes,
      });
      onSaved(record);
    } catch (cause) {
      setError(cause instanceof RecordDataError ? cause.message : 'We could not save this medicine record.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[90] grid place-items-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Add medicine record"
        className="w-full max-w-lg rounded-lg border border-[#2A4033] bg-[#111D18] p-5 shadow-2xl sm:p-6"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#FB7185]/15 text-[#FDA4AF]">
              <Pill className="size-5" />
            </span>
            <div>
              <p className="text-[10px] font-bold tracking-[0.16em] text-[#FB7185]">HEALTH LOG</p>
              <h2 className="mt-0.5 text-xl font-bold text-[#F0F5F2]">Add medicine record</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            aria-label="Close dialog"
            className="flex size-9 items-center justify-center rounded-md border border-[#2A4033] text-[#9AA9A0] hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-xs font-semibold text-[#C4D0C9]">
            Animal
            <select
              value={animalId}
              onChange={(event) => setAnimalId(event.target.value)}
              required
              className="mt-2 h-10 w-full rounded-md border border-[#2A4033] bg-[#0B1511] px-3 text-sm font-normal text-[#E7EFEA] outline-none focus:border-[#FB7185]"
            >
              <option value="">Choose an animal…</option>
              {animals.map((animal) => (
                <option key={animal.id} value={animal.id}>
                  {animal.tagNumber} · {animal.name} · {animal.breed}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-xs font-semibold text-[#C4D0C9]">
            Medicine / treatment name
            <input
              name="medicine_name"
              type="text"
              required
              maxLength={120}
              placeholder="e.g. Oxytetracycline 200 LA"
              className="mt-2 h-10 w-full rounded-md border border-[#2A4033] bg-[#0B1511] px-3 text-sm font-normal text-[#E7EFEA] outline-none placeholder:text-[#596A60] focus:border-[#FB7185]"
            />
          </label>

          <div>
            <span className="text-xs font-semibold text-[#C4D0C9]">Category</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {MEDICINE_CATEGORIES.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setCategory(option)}
                  className={`min-h-9 rounded-full border px-3 text-xs font-semibold transition-colors ${category === option
                    ? 'border-[#FB7185]/60 bg-[#FB7185]/15 text-[#FDA4AF]'
                    : 'border-[#2A4033] bg-[#0B1511] text-[#9AA9A0] hover:text-white'}`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-xs font-semibold text-[#C4D0C9]">
              Dosage
              <input
                name="dosage"
                type="text"
                placeholder="e.g. 10"
                className="mt-2 h-10 w-full rounded-md border border-[#2A4033] bg-[#0B1511] px-3 text-sm font-normal text-[#E7EFEA] outline-none placeholder:text-[#596A60] focus:border-[#FB7185]"
              />
            </label>
            <label className="block text-xs font-semibold text-[#C4D0C9]">
              Unit
              <select
                name="dosage_unit"
                className="mt-2 h-10 w-full rounded-md border border-[#2A4033] bg-[#0B1511] px-3 text-sm font-normal text-[#E7EFEA] outline-none focus:border-[#FB7185]"
              >
                {['mL', 'g', 'mg', 'tablets', 'sachet', 'bolus', 'dose'].map((unit) => (
                  <option key={unit}>{unit}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-xs font-semibold text-[#C4D0C9]">
              Date given
              <input
                name="given_on"
                type="date"
                required
                value={givenOn}
                onChange={(event) => setGivenOn(event.target.value)}
                max={dateToday}
                className="mt-2 h-10 w-full rounded-md border border-[#2A4033] bg-[#0B1511] px-3 text-sm font-normal text-[#E7EFEA] outline-none focus:border-[#FB7185]"
              />
            </label>
            <label className="block text-xs font-semibold text-[#C4D0C9]">
              Next due (optional)
              <input
                name="next_due_date"
                type="date"
                min={givenOn}
                defaultValue=""
                className="mt-2 h-10 w-full rounded-md border border-[#2A4033] bg-[#0B1511] px-3 text-sm font-normal text-[#E7EFEA] outline-none focus:border-[#FB7185]"
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-xs font-semibold text-[#C4D0C9]">
              Cost (KSh, optional)
              <input
                name="cost_ksh"
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g. 450"
                className="mt-2 h-10 w-full rounded-md border border-[#2A4033] bg-[#0B1511] px-3 text-sm font-normal text-[#E7EFEA] outline-none placeholder:text-[#596A60] focus:border-[#FB7185]"
              />
            </label>
            <label className="block text-xs font-semibold text-[#C4D0C9]">
              Administered by (optional)
              <input
                name="administered_by"
                type="text"
                maxLength={120}
                placeholder="e.g. Vet John Kamau"
                className="mt-2 h-10 w-full rounded-md border border-[#2A4033] bg-[#0B1511] px-3 text-sm font-normal text-[#E7EFEA] outline-none placeholder:text-[#596A60] focus:border-[#FB7185]"
              />
            </label>
          </div>

          <label className="block text-xs font-semibold text-[#C4D0C9]">
            Notes
            <textarea
              name="notes"
              rows={3}
              className="mt-2 w-full rounded-md border border-[#2A4033] bg-[#0B1511] px-3 py-2 text-sm text-white outline-none focus:border-[#FB7185]"
              placeholder="e.g. observe withdrawal period before milking"
            />
          </label>

          {error && (
            <p role="alert" className="rounded-md border border-[#FB7185]/25 bg-[#FB7185]/[0.07] px-3 py-2 text-xs text-[#FDA4AF]">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 border-t border-[#24372D] pt-4">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="min-h-10 rounded-md border border-[#2A4033] px-4 text-xs font-semibold text-[#C4D0C9] hover:border-zinc-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[#FB7185] px-4 text-xs font-bold text-[#1A0B0F] transition-colors hover:bg-[#FDA4AF] disabled:cursor-wait disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save medicine record'} <Check className="size-4" />
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

