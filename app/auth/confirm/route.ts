import type { EmailOtpType } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabasePublicConfig } from '@/lib/supabase/config';

function getSafeNextPath(value: string | null, origin: string) {
  if (!value?.startsWith('/') || value.startsWith('//')) return new URL('/portal#pricing', origin);

  const target = new URL(value, origin);
  return target.origin === origin ? target : new URL('/portal#pricing', origin);
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const tokenHash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type') as EmailOtpType | null;
  const redirectUrl = getSafeNextPath(requestUrl.searchParams.get('next'), requestUrl.origin);
  const config = getSupabasePublicConfig();

  if (!config || (!code && (!tokenHash || !type))) {
    return NextResponse.redirect(new URL('/login?authError=confirmation', requestUrl.origin));
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.redirect(new URL('/login?authError=configuration', requestUrl.origin));
  }

  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : await supabase.auth.verifyOtp({ token_hash: tokenHash!, type: type! });

  if (error) {
    return NextResponse.redirect(new URL('/login?authError=confirmation', requestUrl.origin));
  }

  const response = NextResponse.redirect(redirectUrl);
  response.headers.set('Cache-Control', 'private, no-store, max-age=0');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  return response;
}
