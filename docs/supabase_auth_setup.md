# Supabase Auth Setup

The app uses Supabase email/password authentication with cookie-backed sessions. The `.env.example` file contains placeholders only.

## Local environment

1. Copy the template to a local-only environment file:

   ```powershell
   Copy-Item .env.example .env.local
   ```

2. In `.env.local`, set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from the Supabase project's Connect dialog. Do not commit `.env.local` or share keys in chat.
3. Restart `npm run dev` after setting the values.

## Supabase dashboard

1. Enable Email under Authentication providers and decide whether new accounts require email confirmation.
2. Set the local Site URL to `http://localhost:3000`.
3. Add `http://localhost:3000/**` to the allowed redirect URLs for local testing. In production, add only the required callback and final destination URLs for your deployed domain.
4. In the confirmation email template, send the token hash through the app callback and use the requested final destination:

   ```html
   <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next={{ .RedirectTo }}">Confirm your email</a>
   ```

5. In the password recovery email template, use the same callback with the recovery type:

   ```html
   <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next={{ .RedirectTo }}">Reset your password</a>
   ```

6. Configure a custom SMTP provider before relying on confirmation or recovery emails in production. Supabase's default email sender is intended for limited testing.
7. Enable Supabase CAPTCHA/bot protection and review Auth rate limits before launch. Keep the service-role key server-only; this app uses only the publishable key in the browser.

## Flows

- Sign up: email confirmation returns through `/auth/confirm` and, after verification, redirects to `/portal#pricing`.
- Sign in: a valid email/password session redirects to `/portal#pricing`.
- Forgot password: the recovery email returns through `/auth/confirm`, opens `/account/update-password`, then redirects to `/portal#pricing` after the password changes.
- `/portal` verifies Supabase claims server-side; the Next.js 16 `proxy.ts` refreshes the Supabase session cookies.

Without the two local environment variables, signup and sign-in stay disabled with a setup notice, and `/portal` redirects to `/login`.
