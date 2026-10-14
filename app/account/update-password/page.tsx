import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import UpdatePasswordCard from '@/components/auth/UpdatePasswordCard';
import { getSupabasePublicConfig } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/server';
import logo from '../../../images/logoF.png';

export const metadata = {
  title: 'Update password | Olerai Ranchly',
  description: 'Choose a new password for your Olerai Ranchly account.',
};

export const dynamic = 'force-dynamic';

export default async function UpdatePasswordPage() {
  if (!getSupabasePublicConfig()) redirect('/login?authError=configuration');

  const supabase = await createClient();
  if (!supabase) redirect('/login?authError=configuration');

  const { data: claims, error } = await supabase.auth.getClaims();
  if (error || !claims) redirect('/login?authError=recovery');

  return (
    <main className="min-h-screen bg-[#F1F2EB] text-zinc-950">
      <header className="flex min-h-[72px] items-center justify-between border-b border-zinc-200 bg-[#FCFBF7] px-4 sm:px-6 lg:px-10">
        <Link href="/" aria-label="Olerai Ranchly home" className="flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#FFF1C7] ring-1 ring-[#E49B0F]/70">
            <Image src={logo} alt="" priority className="size-10 object-contain" />
          </span>
          <span className="text-lg font-bold leading-none text-black">Olerai<span className="text-[#E49B0F]">Ranchly</span></span>
        </Link>
        <Link href="/login" className="text-xs font-semibold text-zinc-600 transition-colors hover:text-[#004700]">Back to log in</Link>
      </header>
      <div className="mx-auto flex min-h-[calc(100dvh-72px)] max-w-7xl items-center justify-center px-4 py-10 sm:px-6">
        <UpdatePasswordCard />
      </div>
    </main>
  );
}
