import { ArrowUpRight, ClipboardList, Store, UserRoundPlus } from 'lucide-react';

export default function HowItWorks() {
  const steps = [
    {
      num: '01',
      label: 'GET STARTED',
      title: 'Sign up free',
      desc: 'Register with your phone number and choose your role.',
      icon: UserRoundPlus,
      color: 'bg-[#004700]',
    },
    {
      num: '02',
      label: 'BUILD YOUR HERD',
      title: 'Add your animals',
      desc: 'Record breed, health, yield and photos — build your digital herd.',
      icon: ClipboardList,
      color: 'bg-[#E49B0F]',
    },
    {
      num: '03',
      label: 'REACH THE MARKET',
      title: 'Grow & sell',
      desc: 'Reach vets, find buyers, source tools and connect to finance.',
      icon: Store,
      color: 'bg-[#B94E2F]',
    },
  ];

  return (
    <section id="how-it-works" className="relative overflow-hidden bg-[#f4f4f0] py-20 sm:py-24">
      <div className="container mx-auto px-4">
        <div className="mb-14 grid gap-8 md:mb-16 md:grid-cols-[1fr_auto] md:items-end">
          <div className="max-w-3xl">
            <div className="mb-5 flex items-center gap-3 text-xs font-bold tracking-[0.18em] text-[#004700]">
              <span className="h-px w-8 bg-[#E49B0F]" />
              THE RANCHLY ROUTE
            </div>
            <h2 className="max-w-2xl text-4xl font-bold leading-[1.08] text-zinc-950 sm:text-5xl">
              From signup to your <span className="font-serif font-medium italic text-[#004700]">first sale,</span> in three steps
            </h2>
          </div>
          <div className="flex items-center gap-4 border-l-2 border-[#E49B0F] pl-4 md:mb-1 md:max-w-64">
            <span className="font-serif text-4xl font-semibold leading-none text-[#004700]">2</span>
            <p className="text-sm leading-snug text-zinc-600">
              <span className="block font-bold text-zinc-900">minutes to get started</span>
              No credit card. No technical know-how.
            </p>
          </div>
        </div>

        <ol className="relative grid gap-4 md:grid-cols-3">
          <div aria-hidden="true" className="absolute left-[16.666%] right-[16.666%] top-14 hidden h-px bg-zinc-300 md:block" />
          {steps.map((step) => (
            <li key={step.num} className="relative">
              <article className="group h-full rounded-md border border-zinc-200/80 bg-white p-6 shadow-[0_8px_24px_rgba(24,24,27,0.035)] transition-all duration-300 motion-safe:hover:-translate-y-1 hover:border-[#004700]/25 hover:shadow-[0_16px_32px_rgba(24,24,27,0.09)] sm:p-8">
                <div className="relative mb-8 flex items-center justify-center">
                  <span className={`relative z-10 flex size-12 items-center justify-center rounded-full text-white ring-8 ring-white ${step.color}`}>
                    <step.icon aria-hidden="true" className="size-5 stroke-[1.8]" />
                  </span>
                  <span className="absolute right-0 font-mono text-xs font-semibold tracking-[0.12em] text-zinc-400">{step.num} / 03</span>
                </div>
                <p className="mb-3 text-[11px] font-bold tracking-[0.16em] text-[#004700]">{step.label}</p>
                <h3 className="mb-3 text-2xl font-bold tracking-normal text-zinc-950">{step.title}</h3>
                <p className="max-w-sm text-sm leading-6 text-zinc-600">{step.desc}</p>
                <div className="mt-8 flex items-center gap-3 text-xs font-semibold text-zinc-400">
                  <span className="h-px w-8 bg-[#E49B0F] transition-all duration-300 group-hover:w-12" />
                  STEP {step.num}
                  {step.num === '03' && <ArrowUpRight aria-hidden="true" className="ml-auto size-4 text-[#004700]" />}
                </div>
              </article>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
