# gains.

A feel-good fitness companion for workout planning, nutrition ideas, progress check-ins, and motivation.

## Get started

```sh
npm install
npm run dev
```

## Enable sign-up and sign-in

Gains uses Supabase Auth for email-and-password accounts. To connect it:

1. Create a project at [supabase.com](https://supabase.com/).
2. In the project dashboard, enable the **Email** sign-in provider.
3. Copy `.env.example` to `.env.local`.
4. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env.local`. Use the project's publishable key (or legacy anon key); **never** put a service-role key in a client app.
5. Set the app's production URL as the Supabase **Site URL**, and add your local and deployed app URLs to **Authentication → URL Configuration → Redirect URLs**.
6. Restart the development server after changing environment variables.

New members complete a short, two-step sign-up, verify their email when confirmation is enabled in Supabase, and can sign in or request a password-reset email. Name, goal, weight, height, age, calorie-equation selection, and weekly workout frequency are saved to the authenticated user's Supabase metadata.

The nutrition page estimates daily calories using the adult Mifflin–St Jeor equation, the selected female/male equation (or their midpoint for the neutral estimate), an activity multiplier based on planned weekly workouts, and a modest goal adjustment. It is a general starting estimate, not a dietary prescription. Water intake uses a rounded 35 ml/kg starting estimate, clamped to 1.5–4 L/day; individual needs vary, and the app does not provide medical advice.

Weight history, workout check-ins, and today's water total are stored in browser storage, scoped to the signed-in user on that device. They currently do not sync between devices. If Supabase is not configured, the app displays setup instructions instead of collecting credentials.

Members choose 2–6 specific training days and their preferred gym time during onboarding. Once push reminders are enabled with the dashboard bell, Gains can send a Web Push notification one hour before a scheduled session and, if the workout is not checked in, one supportive nudge two hours after the planned start. Missed-workout quotes include “Never miss two days in a row.” Push uses a service worker and a scheduled Supabase Edge Function, so reminders can arrive when Gains is closed. The browser/device must support Web Push, allow notifications, and be online. In-app reminders still appear while Gains is open.

### Enable reminders while Gains is closed

Browser-closed reminders need a one-time backend setup in Supabase and a one-time opt-in from each user's browser/device:

1. Generate a VAPID key pair using `npx web-push generate-vapid-keys`. Keep the private key secret. Put only the public key in `VITE_VAPID_PUBLIC_KEY` in `.env.local` and in the deployed app's build environment, then rebuild/redeploy the app.
2. Install and authenticate the Supabase CLI, link this project with `supabase link --project-ref <your-project-ref>`, then apply the database migration with `supabase db push`. It creates protected tables for gym schedules, push subscriptions, check-ins, and duplicate prevention.
3. Set the Edge Function secrets in Supabase (Dashboard → Edge Functions → Secrets, or the CLI). Set `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` to the generated pair, `VAPID_SUBJECT` to a contact such as `mailto:you@example.com`, and `GYM_REMINDER_CRON_SECRET` to a new random secret. Do not put the private VAPID key or cron secret in any `VITE_` variable or client file.
4. Deploy the scheduled sender with `supabase functions deploy send-gym-reminders`. The function checks schedules once per minute and uses `GYM_REMINDER_CRON_SECRET` to reject unauthorized calls.
5. In the Supabase Dashboard, enable the `pg_cron`, `pg_net`, and `supabase_vault` database extensions. In Database → Vault, create these secrets (use the same cron secret configured for the Edge Function):
   - `gains_project_url`: your Supabase project URL
   - `gains_publishable_key`: your Supabase publishable key
   - `gains_reminder_cron_secret`: the value of `GYM_REMINDER_CRON_SECRET`

   Then, in the SQL Editor, schedule the Edge Function once per minute:

   ```sql
   select cron.schedule(
     'gains-send-gym-reminders',
     '* * * * *',
     $$
     select net.http_post(
       url := (select decrypted_secret from vault.decrypted_secrets where name = 'gains_project_url')
         || '/functions/v1/send-gym-reminders',
       headers := jsonb_build_object(
         'Content-Type', 'application/json',
         'apikey', (select decrypted_secret from vault.decrypted_secrets where name = 'gains_publishable_key'),
         'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'gains_reminder_cron_secret')
       ),
       body := '{}'::jsonb
     );
     $$
   );
   ```

6. Sign in to Gains on each device and click the bell to grant permission and register that browser for push. Users can receive reminders while the app is closed after opting in. Devices must still be online and permit background notifications; iOS browsers require the web app to be installed on the Home Screen.

The app saves workout check-ins to Supabase so the two-hour missed-workout notification is sent only when that scheduled workout has not been marked complete. The rest of the progress history remains device-local.

### Troubleshooting sign-up

- **“Couldn’t reach Supabase” / “Failed to fetch”:** Check that `.env.local` is in the project root and contains your own Supabase project URL and publishable key, without quotes or placeholder text. Restart `npm run dev` after editing the file. Confirm the Supabase project is active and reachable.
- **Deployed app cannot reach Supabase:** Add both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to your hosting provider's build environment, then rebuild and redeploy.
- **Redirect or confirmation-link issue:** Set your deployed site URL in Supabase Auth's Site URL and add the exact local/deployed origins to its Redirect URLs.
- **Sign-up is disabled:** Enable the Email provider in the Supabase project's Authentication settings.

## Scripts

- `npm run dev` — start the development server
- `npm run build` — type-check and create a production build
- `npm run lint` — lint the project
- `npm run preview` — serve the production build locally
