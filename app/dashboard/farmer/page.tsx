import { redirect } from 'next/navigation';
import FarmerDashboard from '@/components/dashboard/FarmerDashboard';
import { getSupabasePublicConfig } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'Farmer dashboard | Olerai Ranchly',
  description: 'Manage your herd, farm tasks, marketplace, and services in one place.',
};

export const dynamic = 'force-dynamic';

export default async function FarmerDashboardPage() {
  if (!getSupabasePublicConfig()) redirect('/login?authError=configuration');

  const supabase = await createClient();
  if (!supabase) redirect('/login?authError=configuration');

  const { data: claims, error } = await supabase.auth.getClaims();
  if (error || !claims) redirect('/login?authError=unauthorized');

  const email = typeof claims.claims.email === 'string' ? claims.claims.email : 'Farmer';
  return <FarmerDashboard email={email} />;
}
