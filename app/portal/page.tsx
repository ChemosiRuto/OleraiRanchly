import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowRight, ArrowRightLeft, Beef, Check, ShieldCheck, ShoppingCart, Stethoscope } from 'lucide-react';
import { getSupabasePublicConfig } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/server';
import logo from '../../images/logoF.png';

export const metadata = {
  title: 'Choose your workspace | Olerai Ranchly',
  description: 'Open your Olerai Ranchly workspace and explore plans for farmers and service providers.',
};

export const dynamic = 'force-dynamic';

const workspaces = [
  {
    number: '01',
    role: 'FARMER',
    title: 'Farmer dashboard',
    description: 'Keep your herd records, services and selling tools in one place.',
    href: '/dashboard/farmer',
    icon: Beef,
    accent: 'text-[#004700]',
    iconSurface: 'bg-[#EAF1E6]',
    edge: 'border-t-[#004700]',
  },
  {
    number: '02',
    role: 'VETERINARIAN',
    title: 'Veterinarian dashboard',
    description: 'Manage your practice, consultations and farmer bookings.',
    href: '/dashboard/veterinarian',
    icon: Stethoscope,
    accent: 'text-[#A9462D]',
    iconSurface: 'bg-[#F8EAE4]',
    edge: 'border-t-[#A9462D]',
  },
  {
    number: '03',
    role: 'AGRO-CHEMIST',
    title: 'Agro-chemist dashboard',
    description: 'Showcase products, manage inquiries and reach nearby farmers.',
    href: '/dashboard/agro-chemist',
    icon: ShoppingCart,
    accent: 'text-[#9A6600]',
    iconSurface: 'bg-[#FFF1D0]',
    edge: 'border-t-[#E49B0F]',
  },
];

const plans = [
  {
    name: 'Farmer',
    audience: 'FREE TO START',
    price: 'KSh 100',
    description: 'One monthly price unlocks the complete Farmer Pro feature set.',
    features: ['All Farmer Pro dashboard features', 'Herd, health and yield tools', 'Marketplace and farm-business tools'],
    upgradeNote: 'A free farmer tier is also available. Farmer Pro unlocks at KSh 100/month.',
    style: 'border-[#E49B0F] bg-[#FFF9EA]',
    labelStyle: 'text-[#004700] bg-[#EAF1E6]',
  },
  {
    name: 'Veterinarian',
    audience: 'PRO ACCESS',
    price: 'KSh 100',
    description: 'Full Veterinarian Pro access for a standalone account.',
    features: ['All Veterinarian Pro dashboard features', 'Practice profile and client discovery', 'Bookings, consultations and client tools'],
    upgradeNote: 'Already on a paid role? Add Veterinarian access for +KSh 50/month.',
    style: 'border-zinc-200 bg-white',
    labelStyle: 'text-[#A9462D] bg-[#F8EAE4]',
  },
  {
    name: 'Agro-chemist',
    audience: 'PRO ACCESS',
    price: 'KSh 100',
    description: 'Full Agro-chemist Pro access for a standalone account.',
    features: ['All Agro-chemist Pro dashboard features', 'Storefront and product catalogue', 'Farmer inquiries and seller tools'],
    upgradeNote: 'Already on a paid role? Add Agro-chemist access for +KSh 50/month.',
    style: 'border-zinc-200 bg-white',
    labelStyle: 'text-[#805500] bg-[#FFF1D0]',
  },
];

const roleBundles = [
  { roles: 'Farmer + Veterinarian', calculation: 'KSh 100 + KSh 50', total: 'KSh 150' },
  { roles: 'Farmer + Agro-chemist', calculation: 'KSh 100 + KSh 50', total: 'KSh 150' },
  { roles: 'Veterinarian + Agro-chemist', calculation: 'KSh 100 + KSh 50', total: 'KSh 150' },
  { roles: 'Farmer + Veterinarian + Agro-chemist', calculation: 'KSh 100 + KSh 50 + KSh 50', total: 'KSh 200' },
];

export default async function PortalPage() {
  if (!getSupabasePublicConfig()) redirect('/login?authError=configuration');

  const supabase = await createClient();
  if (!supabase) redirect('/login?authError=configuration');

  const { data: claims, error } = await supabase.auth.getClaims();
  if (error || !claims) redirect('/login?authError=unauthorized');

  return (
    <main className="min-h-screen overflow-hidden bg-[#F1F2EB] text-zinc-950">
      <header className="relative z-10 border-b border-zinc-200/80 bg-[#FCFBF7]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" aria-label="Olerai Ranchly home" className="flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#FFF1C7] ring-1 ring-[#E49B0F]/60">
              <Image src={logo} alt="" priority className="size-10 object-contain" />
            </span>
            <span className="text-lg font-bold leading-none text-black">Olerai<span className="text-[#E49B0F]">Ranchly</span></span>
          </Link>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500 sm:gap-5">
            <span className="hidden items-center gap-2 sm:inline-flex"><ShieldCheck aria-hidden="true" className="size-4 text-[#004700]" /> Member portal</span>
            <Link href="/" className="rounded-sm border border-zinc-300 px-3 py-2 text-zinc-800 transition-colors hover:border-[#004700] hover:text-[#004700]">Back to site</Link>
          </div>
        </div>
      </header>

      <section className="relative isolate overflow-hidden bg-[#063D2D] text-white">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-8 lg:py-20">
          <div>
            <p className="mb-5 flex items-center gap-3 text-[11px] font-bold tracking-[0.2em] text-[#F3C96A]">
              <span className="h-px w-8 bg-[#E49B0F]" /> RANCHLY / MEMBER ACCESS
            </p>
            <h1 className="max-w-2xl text-4xl font-bold leading-[1.08] sm:text-5xl lg:text-6xl">
              Your work. Your people. <span className="font-serif font-medium italic text-[#F3C96A]">One place.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-emerald-50/80 sm:text-lg">
              Choose the workspace built around your role and get straight to what matters.
            </p>
            <Link href="#workspaces" className="mt-8 inline-flex min-h-12 items-center gap-5 bg-[#E49B0F] px-5 text-sm font-bold text-zinc-950 transition-colors hover:bg-[#F3C96A]">
              Choose your workspace <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>

          <div className="border-l border-white/20 pl-5 sm:pl-8">
            <div className="mb-2 flex items-center justify-between border-b border-white/20 pb-4">
              <p className="text-[10px] font-bold tracking-[0.2em] text-emerald-50/60">THREE WAYS TO MOVE FORWARD</p>
              <ShieldCheck aria-hidden="true" className="size-4 text-[#F3C96A]" />
            </div>
            <div>
              {workspaces.map((workspace) => (
                <div key={workspace.number} className="flex items-center gap-4 border-b border-white/15 py-4 last:border-b-0">
                  <span className="font-mono text-xs text-white/40">{workspace.number}</span>
                  <span className={`flex size-10 shrink-0 items-center justify-center rounded-sm ${workspace.iconSurface}`}>
                    <workspace.icon aria-hidden="true" className={`size-5 ${workspace.accent}`} strokeWidth={1.8} />
                  </span>
                  <span className="text-sm font-semibold tracking-wide text-white">{workspace.role}</span>
                  <ArrowRight aria-hidden="true" className="ml-auto size-4 text-[#F3C96A]" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <section id="workspaces" className="py-12 sm:py-16 lg:py-20" aria-labelledby="workspace-heading">
          <div className="mb-7 flex flex-col justify-between gap-4 sm:mb-9 sm:flex-row sm:items-end">
            <div>
              <p className="mb-3 text-[11px] font-bold tracking-[0.18em] text-[#004700]">PICK UP WHERE YOU LEFT OFF</p>
              <h2 id="workspace-heading" className="text-3xl font-bold leading-tight sm:text-4xl">Choose your workspace</h2>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-zinc-600">One connected livestock community. Three focused workspaces.</p>
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {workspaces.map((workspace) => (
              <Link key={workspace.number} href={workspace.href} className={`group relative flex min-h-72 flex-col overflow-hidden border border-zinc-200 border-t-[3px] bg-[#FCFBF7] p-5 transition-all duration-200 hover:-translate-y-1 hover:border-zinc-400 hover:shadow-[0_14px_30px_rgba(24,24,27,0.08)] sm:p-6 ${workspace.edge}`}>
                <div className="relative mb-9 flex items-center justify-between">
                  <span className={`flex size-11 items-center justify-center rounded-sm ${workspace.iconSurface}`}>
                    <workspace.icon aria-hidden="true" className={`size-5 ${workspace.accent}`} strokeWidth={1.8} />
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="font-mono text-xs font-semibold text-zinc-400">{workspace.number}</span>
                    <span className={`text-[10px] font-bold tracking-[0.15em] ${workspace.accent}`}>{workspace.role}</span>
                  </span>
                </div>
                <h3 className="text-2xl font-bold">{workspace.title}</h3>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-zinc-600">{workspace.description}</p>
                <span className="mt-auto flex min-h-11 items-center justify-between gap-2 rounded-md bg-[#E49B0F] px-3 py-2 text-xs font-bold tracking-[0.06em] text-zinc-950 transition-colors group-hover:bg-[#F3C96A] sm:px-4">
                  OPEN DASHBOARD <ArrowRight aria-hidden="true" className="size-4 shrink-0 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <section id="pricing" className="border-y border-zinc-200 bg-[#FCFBF7]" aria-labelledby="pricing-heading">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:mb-10 sm:flex-row sm:items-end">
            <div>
              <p className="mb-3 text-[11px] font-bold tracking-[0.18em] text-[#9A6600]">SIMPLE STARTING POINTS</p>
              <h2 id="pricing-heading" className="text-3xl font-bold leading-tight sm:text-4xl">One role. All Pro tools.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600">Your first paid role is KSh 100/month. Add roles for KSh 50 each and unlock the full Pro feature set for every role.</p>
            </div>
            <span className="border-l-2 border-[#E49B0F] pl-3 text-xs font-medium text-zinc-500">Monthly prices in Kenyan shillings</span>
          </div>

          <div className="mb-6 flex items-start gap-3 border-l-2 border-[#E49B0F] bg-[#F1F2EB] p-4 sm:items-center">
            <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[#004700] sm:mt-0" />
            <p className="text-sm leading-relaxed text-zinc-700"><span className="font-bold text-zinc-950">New users: 40 days of access, including 10 bonus days.</span> After day 40, standard monthly subscription pricing resumes.</p>
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            {plans.map((plan) => (
              <article key={plan.name} className={`group relative flex h-full flex-col overflow-hidden border p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_14px_30px_rgba(24,24,27,0.08)] sm:p-6 ${plan.style}`}>
                <div className="mb-4">
                  <span className={`inline-flex px-2 py-1 text-[9px] font-bold tracking-[0.12em] ${plan.labelStyle}`}>{plan.audience}</span>
                  <h3 className="mt-3 text-xl font-bold">{plan.name}</h3>
                </div>
                <div className="flex items-baseline gap-2 border-b border-zinc-200 pb-4">
                  <p className="font-mono text-3xl font-bold tracking-normal">{plan.price}</p>
                  <p className="text-xs font-medium text-zinc-500">/ month</p>
                </div>
                <p className="mt-4 min-h-10 text-sm leading-relaxed text-zinc-600">{plan.description}</p>
                <ul className="mt-5 space-y-3 text-sm text-zinc-700">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[#004700]" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 border-t border-zinc-200 pt-4">
                  <p className="text-sm font-semibold leading-relaxed text-zinc-800">{plan.upgradeNote}</p>
                </div>
              </article>
            ))}
          </div>
          <div className="mt-9 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="bg-[#063D2D] p-5 text-white sm:p-6">
              <p className="mb-3 text-[10px] font-bold tracking-[0.18em] text-[#F3C96A]">MULTI-ROLE MONTHLY TOTALS</p>
              <h3 className="text-2xl font-bold leading-tight">One account. Add roles when you need them.</h3>
              <p className="mt-3 text-sm leading-relaxed text-emerald-50/75">Start at KSh 100/month for one role. Every additional role adds KSh 50/month, up to KSh 200/month for all three.</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {roleBundles.map((bundle) => (
                <article key={bundle.roles} className="flex flex-col justify-between gap-3 border border-zinc-200 bg-white p-4">
                  <h4 className="text-sm font-bold leading-snug">{bundle.roles}</h4>
                  <div className="flex items-end justify-between gap-2 border-t border-zinc-100 pt-3">
                    <span className="font-mono text-[11px] text-zinc-500">{bundle.calculation}</span>
                    <span className="shrink-0 text-right text-sm font-bold text-[#004700]">{bundle.total}<span className="block text-[10px] font-medium text-zinc-500">/ month</span></span>
                  </div>
                </article>
              ))}
            </div>
          </div>
          <div className="mt-6 flex items-start gap-3 border-l-2 border-[#E49B0F] bg-[#F1F2EB] p-4 sm:items-center">
            <ArrowRightLeft aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[#004700] sm:mt-0" />
            <p className="text-xs leading-relaxed text-zinc-600">After access, add, pause or switch roles from your dashboard. Farmer free access is for farmers only; paid prices above unlock the full Pro feature set for each role.</p>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-zinc-500">All amounts are monthly in Kenyan shillings. Combined-role totals use the upgrade prices shown above.</p>
        </div>
      </section>

      <section className="bg-[#E49B0F] text-zinc-950" aria-labelledby="ready-heading">
        <div className="mx-auto grid max-w-7xl gap-7 px-4 py-10 sm:px-6 sm:py-12 lg:grid-cols-[1fr_auto] lg:items-center lg:px-8">
          <div>
            <p className="mb-2 text-[10px] font-bold tracking-[0.18em] text-zinc-800">YOUR NEXT MOVE</p>
            <h2 id="ready-heading" className="text-3xl font-bold leading-tight sm:text-4xl">Ready to start?</h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-800">Choose your workspace today. Add, pause, or switch services later from your dashboard.</p>
          </div>
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <Link href="#workspaces" className="inline-flex min-h-12 items-center justify-between gap-6 rounded-md bg-[#063D2D] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#004700]">
              Choose a workspace <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
            <Link href="#pricing" className="inline-flex min-h-11 items-center px-2 text-sm font-bold text-zinc-900 underline decoration-zinc-800/40 underline-offset-4 transition-colors hover:decoration-zinc-950">
              Review pricing
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-[#063D2D] text-emerald-50">
        <div className="mx-auto grid w-full min-w-0 gap-9 px-4 py-10 sm:px-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-center lg:px-8">
          <Link href="/" aria-label="Olerai Ranchly home" className="flex items-center gap-3 justify-self-start">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#FFF1C7] ring-1 ring-[#E49B0F]/70">
              <Image src={logo} alt="" className="size-11 object-contain" />
            </span>
            <span className="flex flex-col">
              <span className="text-lg font-bold leading-none text-white">Olerai<span className="text-[#F3C96A]">Ranchly</span></span>
              <span className="mt-1 text-[9px] font-bold tracking-[0.16em] text-emerald-100/60">MEMBER WORKSPACE</span>
            </span>
          </Link>
          <nav aria-label="Portal footer" className="flex max-w-full flex-wrap items-center gap-x-6 gap-y-3 text-sm font-medium text-emerald-50/80 md:justify-end">
            <Link href="#workspaces" className="transition-colors hover:text-[#F3C96A]">Workspaces</Link>
            <Link href="#pricing" className="transition-colors hover:text-[#F3C96A]">Pricing</Link>
            <Link href="/" className="transition-colors hover:text-[#F3C96A]">Main site</Link>
          </nav>
        </div>
        <div className="border-t border-white/15">
          <div className="mx-auto flex w-full min-w-0 flex-col gap-2 px-4 py-4 text-xs text-emerald-100/60 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <span>© 2026 Olerai Ranchly</span>
            <span>Built for the people behind every herd.</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
