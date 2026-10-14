import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Beef, ShoppingBasket, Stethoscope } from 'lucide-react';
import LoginCard from '@/components/auth/LoginCard';
import logo from '../../images/logoF.png';

export const metadata = {
  title: 'Log in | Olerai Ranchly',
  description: 'Log in to your Olerai Ranchly workspace.',
};

const roles = [
  { number: '01', label: 'FARMERS', icon: Beef },
  { number: '02', label: 'VETERINARIANS', icon: Stethoscope },
  { number: '03', label: 'AGRO-CHEMISTS', icon: ShoppingBasket },
];

type LoginPageProps = {
  searchParams: Promise<{ authError?: string | string[] }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { authError } = await searchParams;
  const loginError = Array.isArray(authError) ? authError[0] : authError;

  return (
    <main className="min-h-screen bg-[#F1F2EB] text-zinc-950">
      <header className="relative z-10 flex min-h-[72px] items-center justify-between border-b border-zinc-200 bg-[#FCFBF7] px-4 sm:px-6 lg:px-10">
        <Link href="/" aria-label="Olerai Ranchly home" className="flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#FFF1C7] ring-1 ring-[#E49B0F]/70">
            <Image src={logo} alt="" priority className="size-10 object-contain" />
          </span>
          <span className="text-lg font-bold leading-none text-black">Olerai<span className="text-[#E49B0F]">Ranchly</span></span>
        </Link>
        <Link href="/" className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-600 transition-colors hover:text-[#004700]">
          <ArrowLeft aria-hidden="true" className="size-4" /> Back to main site
        </Link>
      </header>

      <div className="mx-auto grid min-h-[calc(100dvh-72px)] max-w-7xl lg:grid-cols-[1fr_1fr]">
        <section className="relative hidden overflow-hidden bg-[#063D2D] p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }}
          />
          <div className="relative">
            <p className="mb-5 flex items-center gap-3 text-[10px] font-bold tracking-[0.2em] text-[#F3C96A]"><span className="h-px w-8 bg-[#E49B0F]" /> RANCHLY / SECURE ACCESS</p>
            <h2 className="max-w-xl text-5xl font-bold leading-[1.08] xl:text-6xl">Back to work that <span className="font-serif font-medium italic text-[#F3C96A]">matters.</span></h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-emerald-50/75">Your herd, practice, and marketplace are ready when you are.</p>
          </div>

          <div className="relative border-t border-white/20 pt-5">
            <p className="mb-3 text-[10px] font-bold tracking-[0.18em] text-emerald-50/55">ONE CONNECTED COMMUNITY</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {roles.map((role) => (
                <div key={role.number} className="flex items-center gap-2 border border-white/15 bg-white/5 px-3 py-3">
                  <role.icon aria-hidden="true" className="size-4 shrink-0 text-[#F3C96A]" />
                  <span className="text-[9px] font-semibold tracking-[0.08em] text-white">{role.label}</span>
                </div>
              ))}
            </div>
          </div>
          <ArrowRight aria-hidden="true" className="absolute bottom-28 right-10 size-8 text-[#E49B0F]/50" />
        </section>

        <section className="flex items-center justify-center px-4 py-10 sm:px-8 lg:px-12">
          <LoginCard authError={loginError} />
        </section>
      </div>
    </main>
  );
}
