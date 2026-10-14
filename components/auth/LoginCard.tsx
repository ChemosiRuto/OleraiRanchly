'use client';

import { type FormEvent, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getSupabasePublicConfig } from '@/lib/supabase/config';

type LoginCardProps = {
  authError?: string;
};

const authErrorMessages: Record<string, string> = {
  configuration: 'Supabase is not configured yet. Add your project URL and publishable key locally.',
  unauthorized: 'Please sign in to access your workspace.',
  confirmation: 'That confirmation link is invalid or expired. Please create your account again.',
  recovery: 'That recovery link is invalid or expired. Request a new password reset email.',
};

export default function LoginCard({ authError }: LoginCardProps) {
  const router = useRouter();
  const emailId = useId();
  const passwordId = useId();
  const emailRef = useRef<HTMLInputElement>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState(authError ? authErrorMessages[authError] ?? '' : '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const supabase = createClient();
    if (!supabase) {
      setMessage('Authentication setup is required before you can sign in.');
      return;
    }

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') ?? '').trim();
    const password = String(formData.get('password') ?? '');

    setIsSubmitting(true);
    setMessage('');
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage('We could not sign you in with those details. Check them and try again.');
        return;
      }

      router.replace('/portal#pricing');
      router.refresh();
    } catch {
      setMessage('We could not reach the sign-in service. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    const email = emailRef.current?.value.trim() ?? '';
    if (!email || !emailRef.current?.checkValidity()) {
      setMessage('Enter your email address above and try again.');
      emailRef.current?.focus();
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setMessage('Authentication setup is required before password recovery can be used.');
      return;
    }

    setIsResetting(true);
    setMessage('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/account/update-password`,
      });
      setMessage(error
        ? 'We could not send a reset email. Please try again later.'
        : 'If an account uses that email, a password reset link is on its way.');
    } catch {
      setMessage('We could not reach the password recovery service. Please try again.');
    } finally {
      setIsResetting(false);
    }
  };

  const isConfigured = Boolean(getSupabasePublicConfig());

  return (
    <section className="w-full max-w-md border border-zinc-200 bg-[#FCFBF7] p-5 shadow-[0_20px_70px_rgba(6,61,45,0.08)] sm:p-8">
      <p className="mb-2 text-[10px] font-bold tracking-[0.18em] text-[#004700]">MEMBER ACCESS / 02</p>
      <h1 className="text-3xl font-bold leading-tight text-zinc-950">Welcome back.</h1>
      <p className="mt-2 text-sm leading-relaxed text-zinc-600">Sign in to continue to your Olerai Ranchly workspace.</p>

      <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
        <label className="block text-xs font-semibold text-zinc-800" htmlFor={emailId}>
          Email address
          <span className="relative mt-1.5 block">
            <Mail aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
            <input ref={emailRef} id={emailId} name="email" type="email" inputMode="email" autoComplete="email" required className="h-12 w-full border border-zinc-300 bg-white pl-10 pr-3 text-sm font-normal text-zinc-950 outline-none transition focus:border-[#004700] focus:ring-2 focus:ring-[#004700]/15" placeholder="you@example.com" />
          </span>
        </label>

        <label className="block text-xs font-semibold text-zinc-800" htmlFor={passwordId}>
          Password
          <span className="relative mt-1.5 block">
            <LockKeyhole aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
            <input id={passwordId} name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required className="h-12 w-full border border-zinc-300 bg-white px-10 text-sm font-normal text-zinc-950 outline-none transition focus:border-[#004700] focus:ring-2 focus:ring-[#004700]/15" placeholder="Enter your password" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center text-zinc-500 hover:text-zinc-900">
              {showPassword ? <EyeOff aria-hidden="true" className="size-4" /> : <Eye aria-hidden="true" className="size-4" />}
            </button>
          </span>
        </label>

        <div className="flex items-center justify-between gap-4 text-xs">
          {isConfigured ? (
            <span className="flex items-center gap-2 text-[#004700]"><span className="size-1.5 rounded-full bg-[#004700]" /> Email sign-in</span>
          ) : (
            <span className="flex items-center gap-2 text-[#805500]"><span className="size-1.5 rounded-full bg-[#E49B0F]" /> Setup required</span>
          )}
          <button type="button" disabled={isResetting} onClick={() => void handleForgotPassword()} className="font-semibold text-[#004700] underline decoration-[#004700]/30 underline-offset-4 hover:decoration-[#004700] disabled:opacity-60">{isResetting ? 'Sending reset link...' : 'Forgot password?'}</button>
        </div>

        <button type="submit" disabled={isSubmitting || !isConfigured} className="flex h-12 w-full items-center justify-between bg-[#063D2D] px-4 text-sm font-bold text-white transition-colors hover:bg-[#004700] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E49B0F] disabled:cursor-not-allowed disabled:opacity-50">
          {isSubmitting ? 'Signing in...' : 'Log in'} <ArrowRight aria-hidden="true" className="size-4" />
        </button>
        {message && <p role="status" aria-live="polite" className="border-l-2 border-[#E49B0F] bg-[#FFF5D9] p-3 text-xs leading-relaxed text-zinc-700">{message}</p>}
        {!isConfigured && <p className="text-xs leading-relaxed text-zinc-500">Add the Supabase URL and publishable key in your local environment to enable sign-in.</p>}
      </form>

      <p className="mt-6 border-t border-zinc-200 pt-5 text-sm text-zinc-600">New to Ranchly? <Link href="/#header-start-free" className="font-bold text-[#004700] underline decoration-[#004700]/30 underline-offset-4 hover:decoration-[#004700]">Create an account</Link></p>
    </section>
  );
}
