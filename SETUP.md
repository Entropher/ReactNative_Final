# GiftMaster mobile: setup guide

Steps to get the app running with your own accounts, from first launch to the
App Store and Google Play. Do them in order. Commands work in PowerShell.

What you'll need:

| Account | Needed for | Cost |
| --- | --- | --- |
| [Supabase](https://supabase.com) | Sign-in, database, server functions | Free tier is enough to start |
| [Anthropic Console](https://console.anthropic.com) | The Claude API key that writes the gift ideas | Pay per use (about $0.002 per search with Claude Haiku 5.5) |
| [Expo](https://expo.dev) | Building the app in the cloud (no Mac needed) | Free tier is enough to start |
| [Apple Developer](https://developer.apple.com/programs/) | Sign in with Apple, iPhone builds, App Store | $99/year |
| [Google Play Console](https://play.google.com/console) | Publishing on Android | $25 once |

---

## 1. Supabase backend

1. Create a new project at [supabase.com/dashboard](https://supabase.com/dashboard).
2. Connect this folder to it and create the database tables:

   ```powershell
   npx supabase login
   npx supabase link          # pick your new project from the list
   npx supabase db push       # runs supabase/migrations/*.sql
   ```

3. Store your Claude API key as a server secret. It stays on Supabase's servers
   and never goes into the app:

   ```powershell
   npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-your-key-here
   ```

4. Deploy the four server functions (`--use-api` means Docker isn't needed):

   ```powershell
   npx supabase functions deploy --use-api
   ```

5. In the dashboard, go to **Authentication > URL Configuration**:
   - **Site URL**: `https://giftmaster.pro`
   - **Redirect URLs**: add `giftmaster://**` and `exp://**`

   These let the "confirm your email" and "reset your password" links open the app.

6. Set up your own email sender. Supabase's built-in email only reaches the
   addresses of your Supabase team members, at most 2 emails per hour, so real
   users would never get their confirmation or password-reset emails. Your
   website already uses [Resend](https://resend.com). In Resend, verify the
   `giftmaster.pro` domain and create an API key. Then in Supabase, go to
   **Authentication > Emails > SMTP Settings** and enter:
   - Host `smtp.resend.com`, port `465`
   - Username `resend`
   - Password: the Resend API key
   - Sender: an address on your domain, such as `no-reply@giftmaster.pro`

   Until this is done, test sign-up and password reset with the email address
   you use for your Supabase account.

## 2. Run the app for the first time (Expo Go)

1. Copy `.env.example` to `.env.local`. Then fill in `EXPO_PUBLIC_SUPABASE_URL`
   and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from **Project Settings > API**
   in Supabase.
2. Install the **Expo Go** app on your phone, then run:

   ```powershell
   npx expo start
   ```

3. Scan the QR code. You can now sign up with email, confirm the email *on the
   phone*, run a gift search, save gifts, and so on.

## 3. Development build (your own test version of the app)

A development build is GiftMaster's own version of Expo Go. It includes every
native library, so Apple sign-in works the same way it will in the store.

1. Connect the project to Expo:

   ```powershell
   npx eas-cli@latest login
   npx eas-cli@latest init
   ```

2. The cloud build can't see your `.env.local` (it isn't committed to git). On
   [expo.dev](https://expo.dev), open the project, go to **Environment
   variables**, and add each `EXPO_PUBLIC_...` value for the *development*,
   *preview* and *production* environments. They are public values, so
   "Plain text" visibility is fine.
3. Build and install it:

   ```powershell
   npx eas-cli@latest build --profile development --platform android
   npx eas-cli@latest build --profile development --platform ios   # needs the Apple Developer account
   ```

   Install the build from the link EAS gives you, then run `npx expo start`
   and open the project from the development build instead of Expo Go.

## 4. Sign in with Apple

1. The first iOS build with EAS creates the App ID `pro.giftmaster.app` and
   turns on the Sign in with Apple capability for you (because `app.json` has
   `"usesAppleSignIn": true`).
2. In Supabase, go to **Authentication > Providers > Apple**, enable it, and
   under **Client IDs** add: `pro.giftmaster.app`. To also test in Expo Go,
   add `host.exp.Exponent`.

## 5. Publish

```powershell
npx eas-cli@latest build --profile production --platform all
npx eas-cli@latest submit --platform ios
npx eas-cli@latest submit --platform android
```

Before submitting, check that:

- [ ] Your own email sender is set up (step 1.6), or new users can't confirm their email.
- [ ] The store listings link to the privacy policy at https://giftmaster.pro/privacy.
- [ ] The privacy answers (App Store "App Privacy", Play "Data safety") cover: email
      address and name (for the account), and the gift survey answers the user types
      (stored to show their history). Nothing is used for tracking or ads.
- [ ] Shopping links use your Amazon Associates tag (`giftgen-20` in
      `src/lib/shopping.ts`). Amazon's rules require an affiliate disclosure,
      for example in the store description.
- [ ] Screenshots are made from a production or development build.

---

## Useful facts

- **Free searches**: 3 per account per calendar month (UTC). Change the number in
  `public.free_searches_per_month()` in a new migration.
- **"More Like This"**: free, capped at 5 per search (see `claim_similar_request`).
- **AI model**: `claude-haiku-5-5`, set in `supabase/functions/_shared/gift-ai.ts`.
- **Credits** already exist in the database (`profiles.credits`, used after the free
  searches run out). Buying them in the app (Apple/Google in-app purchases) isn't
  built yet.
- **Product photos** come from Amazon's search page, like on the website. Amazon
  often blocks these requests, so many ideas show a gift-box placeholder instead.
- Check the app with `npx tsc --noEmit` and `npx expo lint`. Check the server
  functions with Deno, from inside each function's folder. Run from the project
  root, Deno would try to use the app's `node_modules`:

  ```powershell
  Get-ChildItem supabase/functions -Directory -Exclude _shared | ForEach-Object { Push-Location $_.FullName; deno check index.ts; Pop-Location }
  ```
