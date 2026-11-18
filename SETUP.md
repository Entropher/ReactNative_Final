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
| [Google Cloud](https://console.cloud.google.com) | Sign in with Google | Free |
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

   These let the "confirm your email" link open the app.

## 2. Run the app for the first time (Expo Go)

1. Copy `.env.example` to `.env.local`. Then fill in `EXPO_PUBLIC_SUPABASE_URL`
   and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from **Project Settings > API**
   in Supabase. Leave the Google values empty for now.
2. Install the **Expo Go** app on your phone, then run:

   ```powershell
   npx expo start
   ```

3. Scan the QR code. You can now sign up with email, confirm the email *on the
   phone*, run a gift search, save gifts, and so on.

Expo Go can't run Google sign-in (it needs native code that Expo Go doesn't
include), so that button is hidden there. The next step fixes that.

## 3. Development build (your own test version of the app)

A development build is GiftMaster's own version of Expo Go. It includes every
native library, so Google and Apple sign-in work the same way they will in the
store.

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

Apple requires this on iPhone whenever Google sign-in is offered.

1. The first iOS build with EAS creates the App ID `pro.giftmaster.app` and
   turns on the Sign in with Apple capability for you (because `app.json` has
   `"usesAppleSignIn": true`).
2. In Supabase, go to **Authentication > Providers > Apple**, enable it, and
   under **Client IDs** add: `pro.giftmaster.app`. To also test in Expo Go,
   add `host.exp.Exponent`.

## 5. Sign in with Google

1. In [Google Cloud console](https://console.cloud.google.com), open **Google
   Auth Platform**, set up the consent screen, then create three OAuth
   clients under **Clients**:
   - **Web application**. Its client ID goes in `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`.
   - **iOS**, with bundle ID `pro.giftmaster.app`. Its client ID goes in
     `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`.
   - **Android**, with package name `pro.giftmaster.app` and the SHA-1
     fingerprint shown by `npx eas-cli@latest credentials` (Android > your
     build profile). After you publish, also add the SHA-1 from Play Console
     (**Setup > App signing**).
2. In `app.json`, replace `REPLACE_WITH_YOUR_IOS_CLIENT_ID` in `iosUrlScheme`.
   Use the iOS client ID *reversed*: client ID `1234-abc.apps.googleusercontent.com`
   becomes `com.googleusercontent.apps.1234-abc`.
3. In Supabase, go to **Authentication > Providers > Google**, enable it, and
   paste all three client IDs into **Client IDs**, separated by commas. Turn on
   **Skip nonce check**: the iOS Google library adds a nonce that Supabase
   can't verify.
4. Add the two `EXPO_PUBLIC_GOOGLE_...` values to `.env.local` *and* to the
   Expo environment variables (step 3.2), then make a new development build.

## 6. Publish

```powershell
npx eas-cli@latest build --profile production --platform all
npx eas-cli@latest submit --platform ios
npx eas-cli@latest submit --platform android
```

Before submitting, check that:

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
