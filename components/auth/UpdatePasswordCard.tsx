'use client';

import { type FormEvent, useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Eye, EyeOff, LockKeyhole } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function UpdatePasswordCard() {
  const router = useRouter();
  const passwordId = useId();
  const confirmationId = useId();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const password = String(formData.get('password') ?? '');
    const confirmation = String(formData.get('confirmPassword') ?? '');

    if (password !== confirmation) {
      setMessage('Your passwords do not match. Please check and try again.');
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setMessage('Authentication setup is required before you can update your password.');
      return;
    }

    setIsSubmitting(true);
    setMessage('');
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setMessage('We could not update your password. Please request a new reset link and try again.');
        return;
      }

      router.replace('/portal#pricing');
      router.refresh();
    } catch {
      setMessage('We could not reach the password service. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="w-full max-w-md border border-zinc-200 bg-[#FCFBF7] p-5 shadow-[0_20px_70px_rgba(6,61,45,0.08)] sm:p-8">
      <p className="mb-2 text-[10px] font-bold tracking-[0.18em] text-[#004700]">ACCOUNT SECURITY / 03</p>
      <h1 className="text-3xl font-bold leading-tight text-zinc-950">Choose a new password.</h1>
      <p className="mt-2 text-sm leading-relaxed text-zinc-600">Use at least eight characters, then confirm it below.</p>

      <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
        <label className="block text-xs font-semibold text-zinc-800" htmlFor={passwordId}>
          New password
          <span className="relative mt-1.5 block">
            <LockKeyhole aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
            <input id={passwordId} name="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" minLength={8} required className="h-12 w-full border border-zinc-300 bg-white px-10 text-sm font-normal text-zinc-950 outline-none transition focus:border-[#004700] focus:ring-2 focus:ring-[#004700]/15" placeholder="At least 8 characters" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide new password' : 'Show new password'} className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center text-zinc-500 hover:text-zinc-900">
              {showPassword ? <EyeOff aria-hidden="true" className="size-4" /> : <Eye aria-hidden="true" className="size-4" />}
            </button>
          </span>
        </label>

        <label className="block text-xs font-semibold text-zinc-800" htmlFor={confirmationId}>
          Confirm new password
          <span className="relative mt-1.5 block">
            <LockKeyhole aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
            <input id={confirmationId} name="confirmPassword" type={showConfirmation ? 'text' : 'password'} autoComplete="new-password" minLength={8} required className="h-12 w-full border border-zinc-300 bg-white px-10 text-sm font-normal text-zinc-950 outline-none transition focus:border-[#004700] focus:ring-2 focus:ring-[#004700]/15" placeholder="Re-enter your password" />
            <button type="button" onClick={() => setShowConfirmation(!showConfirmation)} aria-label={showConfirmation ? 'Hide confirmation password' : 'Show confirmation password'} className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center text-zinc-500 hover:text-zinc-900">
              {showConfirmation ? <EyeOff aria-hidden="true" className="size-4" /> : <Eye aria-hidden="true" className="size-4" />}
            </button>
          </span>
        </label>

        <button type="submit" disabled={isSubmitting} className="flex h-12 w-full items-center justify-between bg-[#063D2D] px-4 text-sm font-bold text-white transition-colors hover:bg-[#004700] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E49B0F] disabled:cursor-not-allowed disabled:opacity-60">
          {isSubmitting ? 'Updating password...' : 'Update password'} <ArrowRight aria-hidden="true" className="size-4" />
        </button>
        {message && <p role="status" aria-live="polite" className="border-l-2 border-[#E49B0F] bg-[#FFF5D9] p-3 text-xs leading-relaxed text-zinc-700">{message}</p>}
      </form>
    </section>
  );
}
