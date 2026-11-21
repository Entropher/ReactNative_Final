# GiftMaster (iOS and Android)

The mobile version of [giftmaster.pro](https://giftmaster.pro): answer a short
survey about someone and get 10 personalized gift ideas from Claude, with links
to Amazon, Etsy or Uncommon Goods.

**First time here? Follow [SETUP.md](SETUP.md).**

## Features

- 4-step gift survey, plus an optional "More Details" page
- 10 AI gift ideas per search, with price range, category, shop link and product photo
- "More Like This" for 5 similar ideas, saving favorites, sharing
- Search history with "Use again"
- Email/password (with email confirmation and "Forgot password") and Sign in with Apple
- 3 free searches per month per account
- Light/dark theme and a default budget in Settings; in-app account deletion

## How it's built

| Part | Technology | Where |
| --- | --- | --- |
| App | Expo SDK 58, Expo Router, TypeScript, React Query | `src/` |
| Screens | One file per screen | `src/app/` (`(auth)` = signed out, `(app)` = signed in) |
| Database and sign-in | Supabase (Postgres with row level security) | `supabase/migrations/` |
| AI and server logic | Supabase Edge Functions (Deno), Claude Haiku 5.5 | `supabase/functions/` |

The Claude API key lives only in Supabase's server secrets. The app calls the
Edge Functions, and those call Claude.

## Everyday commands

```powershell
npx expo start          # run the app (scan the QR code with Expo Go or your dev build)
npx tsc --noEmit        # type-check the app
npx expo lint           # lint
npx supabase functions deploy --use-api   # deploy server-function changes
```
