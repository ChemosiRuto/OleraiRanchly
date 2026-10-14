'use client';

import { type FormEvent, type ReactNode, useEffect, useId, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { getSupabasePublicConfig } from '@/lib/supabase/config';
import logo from '../../images/logoF.png';

type StartFreeTriggerProps = {
  children: ReactNode;
  className?: string;
  id?: string;
};

function SignupDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const dialog = dialogRef.current;
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
    dialog?.querySelector<HTMLElement>('#signup-email')?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (event.key !== 'Tab' || !dialog) return;
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
      document.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus();
    };
  }, [onClose]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    if (formData.get('password') !== formData.get('confirmPassword')) {
      setMessage('Your passwords do not match. Please check and try again.');
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setMessage('Authentication setup is required before you can create an account.');
      return;
    }

    const email = String(formData.get('email') ?? '').trim();
    const password = String(formData.get('password') ?? '');
    setIsSubmitting(true);
    setMessage('');

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/portal#pricing`,
        },
      });

      if (error) {
        setMessage(error.status === 429
          ? 'Too many sign-up attempts. Wait a moment, then try again.'
          : 'We could not create your account with those details. Check your email and try again.');
        return;
      }

      if (data.session) {
        router.replace('/portal#pricing');
        router.refresh();
        return;
      }

      setMessage('If this email can receive a confirmation, a link is on its way. Open it to activate your account and continue.');
    } catch {
      setMessage('We could not reach the sign-up service. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isConfigured = Boolean(getSupabasePublicConfig());

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-[#031A14]/75 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className="relative max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-lg border border-zinc-200 bg-[#FCFBF7] shadow-[0_28px_90px_rgba(0,0,0,0.38)] outline-none"
      >
        <section className="relative p-5 pt-6 sm:p-7">
          <div className="relative mb-5 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <span className="flex size-12 items-center justify-center rounded-full bg-[#FFF1C7] ring-1 ring-[#E49B0F]">
                <Image src={logo} alt="" className="size-11 object-contain" />
              </span>
              <span className="text-sm font-bold text-zinc-950">Olerai<span className="text-[#E49B0F]">Ranchly</span></span>
            </div>
            <button type="button" onClick={onClose} aria-label="Close sign-up dialog" className="absolute right-0 top-0 flex size-9 items-center justify-center rounded-md border border-zinc-200 text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#004700]">
              <X aria-hidden="true" className="size-4" />
            </button>
          </div>
          <p className="mb-2 text-center text-[10px] font-bold tracking-[0.18em] text-[#004700]">NEW MEMBER / 01</p>
          <h2 id={titleId} className="text-center text-2xl font-bold leading-tight text-zinc-950">Start with a simple hello.</h2>
          <p id={descriptionId} className="mx-auto mt-2 max-w-sm text-center text-sm leading-relaxed text-zinc-600">Create your account details. You’ll choose your workspace after sign-up.</p>

          <form className="mt-5 space-y-3.5" onSubmit={handleSubmit}>

            <label className="block text-xs font-semibold text-zinc-800" htmlFor="signup-email">
              Email address
              <span className="relative mt-1.5 block">
                <Mail aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
                <input id="signup-email" name="email" type="email" inputMode="email" autoComplete="email" required className="h-11 w-full border border-zinc-300 bg-white pl-10 pr-3 text-sm font-normal text-zinc-950 outline-none transition focus:border-[#004700] focus:ring-2 focus:ring-[#004700]/15" placeholder="you@example.com" />
              </span>
            </label>

            <label className="block text-xs font-semibold text-zinc-800" htmlFor="signup-password">
              Create password
              <span className="relative mt-1.5 block">
                <LockKeyhole aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
                <input id="signup-password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" minLength={8} required className="h-11 w-full border border-zinc-300 bg-white px-10 text-sm font-normal text-zinc-950 outline-none transition focus:border-[#004700] focus:ring-2 focus:ring-[#004700]/15" placeholder="At least 8 characters" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center text-zinc-500 hover:text-zinc-900">
                  {showPassword ? <EyeOff aria-hidden="true" className="size-4" /> : <Eye aria-hidden="true" className="size-4" />}
                </button>
              </span>
            </label>

            <label className="block text-xs font-semibold text-zinc-800" htmlFor="signup-confirm-password">
              Confirm password
              <span className="relative mt-1.5 block">
                <LockKeyhole aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
                <input id="signup-confirm-password" name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} autoComplete="new-password" minLength={8} required className="h-11 w-full border border-zinc-300 bg-white px-10 text-sm font-normal text-zinc-950 outline-none transition focus:border-[#004700] focus:ring-2 focus:ring-[#004700]/15" placeholder="Re-enter your password" />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} aria-label={showConfirmPassword ? 'Hide confirmation password' : 'Show confirmation password'} className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center text-zinc-500 hover:text-zinc-900">
                  {showConfirmPassword ? <EyeOff aria-hidden="true" className="size-4" /> : <Eye aria-hidden="true" className="size-4" />}
                </button>
              </span>
            </label>

            <p className="text-[11px] leading-relaxed text-zinc-500">New users receive 40 days of access, including 10 bonus days.</p>
            <button type="submit" disabled={isSubmitting || !isConfigured} className="relative flex h-11 w-full items-center justify-center rounded-md bg-[#E49B0F] px-4 text-sm font-bold text-zinc-950 transition-colors hover:bg-[#F3C96A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#004700] disabled:cursor-not-allowed disabled:opacity-50">
              {isSubmitting ? 'Creating account...' : 'Create account'} <ArrowRight aria-hidden="true" className="absolute right-4 size-4" />
            </button>
            {message && <p role="status" aria-live="polite" className="border-l-2 border-[#E49B0F] bg-[#FFF5D9] p-3 text-xs leading-relaxed text-zinc-700">{message}</p>}
            {!isConfigured && <p className="text-xs leading-relaxed text-zinc-500">Add the Supabase URL and publishable key in your local environment to enable account creation.</p>}
          </form>

          <p className="mt-5 text-center text-sm text-zinc-600">Already have an account? <Link href="/login" className="font-bold text-[#004700] underline decoration-[#004700]/30 underline-offset-4 hover:decoration-[#004700]">Log in</Link></p>
        </section>
      </div>
    </div>,
    document.body,
  );
}

export default function StartFreeTrigger({ children, className, id }: StartFreeTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button id={id} type="button" aria-haspopup="dialog" aria-expanded={isOpen} onClick={() => setIsOpen(true)} className={className}>{children}</Button>
      {isOpen && <SignupDialog onClose={() => setIsOpen(false)} />}
    </>
  );
}
