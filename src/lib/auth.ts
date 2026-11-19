import * as AppleAuthentication from 'expo-apple-authentication';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

/** Returned when the user closed a sign-in sheet; not an error. */
export const CANCELLED = 'cancelled' as const;

// Email links open the app on these screens; the session arrives in the URL.
const emailRedirectTo = Linking.createURL('/welcome');
const passwordResetRedirectTo = Linking.createURL('/set-new-password');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email.trim());
}

// ---- Email + password ------------------------------------------------------

export async function signUpWithEmail(input: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}): Promise<{ needsConfirmation: boolean }> {
  const fullName = [input.firstName, input.lastName].filter(Boolean).join(' ');
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      emailRedirectTo,
      data: { first_name: input.firstName, last_name: input.lastName, full_name: fullName },
    },
  });
  if (error) throw error;
  // With email confirmation turned on (the default), there's no session yet.
  return { needsConfirmation: !data.session };
}

/** Throws an error with code 'email_not_confirmed' for unverified accounts. */
export async function signInWithEmail(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function resendConfirmationEmail(email: string): Promise<void> {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: { emailRedirectTo },
  });
  if (error) throw error;
}

/** Emails a link that opens the app on the "Choose a new password" screen. */
export async function sendPasswordResetEmail(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: passwordResetRedirectTo,
  });
  if (error) throw error;
}

export async function updatePassword(password: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}

export type AuthLink =
  | { kind: 'session'; accessToken: string; refreshToken: string; isPasswordReset: boolean }
  | { kind: 'error'; message: string };

/**
 * Reads an email link (confirm email or reset password) that opened the app.
 * Supabase puts the session after the '#' in the URL. Returns null for any
 * other link.
 */
export function parseAuthLink(url: string): AuthLink | null {
  const fragment = url.split('#')[1];
  if (!fragment) return null;

  const params = new URLSearchParams(fragment);
  const linkError = params.get('error_description');
  if (linkError) return { kind: 'error', message: linkError };

  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  if (!accessToken || !refreshToken) return null;

  return {
    kind: 'session',
    accessToken,
    refreshToken,
    isPasswordReset: params.get('type') === 'recovery',
  };
}

// ---- Sign in with Apple (iPhone only) --------------------------------------

export async function isAppleSignInAvailable(): Promise<boolean> {
  return Platform.OS === 'ios' && (await AppleAuthentication.isAvailableAsync());
}

export async function signInWithApple(): Promise<typeof CANCELLED | void> {
  let credential: AppleAuthentication.AppleAuthenticationCredential;
  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
  } catch (error) {
    if ((error as { code?: string }).code === 'ERR_REQUEST_CANCELED') return CANCELLED;
    throw error;
  }
  if (!credential.identityToken) throw new Error('Apple did not return a sign-in token.');

  const { error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
  });
  if (error) throw error;

  // Apple only shares the name on the very first sign-in, so save it now.
  const { givenName, familyName } = credential.fullName ?? {};
  if (givenName || familyName) {
    await supabase.auth.updateUser({
      data: {
        first_name: givenName ?? '',
        last_name: familyName ?? '',
        full_name: [givenName, familyName].filter(Boolean).join(' '),
      },
    });
  }
}

// ---- Sign in with Google ---------------------------------------------------

const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

/**
 * Google sign-in needs native code that the Expo Go app doesn't include, so
 * the button is hidden there. It works in development and store builds.
 */
export const isGoogleSignInAvailable =
  Constants.executionEnvironment !== ExecutionEnvironment.StoreClient && !!googleWebClientId;

// Loaded on demand so that simply opening the app in Expo Go doesn't crash.
async function loadGoogleSignIn() {
  const google = await import('@react-native-google-signin/google-signin');
  google.GoogleSignin.configure({ webClientId: googleWebClientId, iosClientId: googleIosClientId });
  return google;
}

export async function signInWithGoogle(): Promise<typeof CANCELLED | void> {
  const { GoogleSignin, isSuccessResponse, isErrorWithCode, statusCodes } = await loadGoogleSignIn();

  let idToken: string | null;
  try {
    await GoogleSignin.hasPlayServices();
    const response = await GoogleSignin.signIn();
    if (!isSuccessResponse(response)) return CANCELLED;
    idToken = response.data.idToken;
  } catch (error) {
    if (isErrorWithCode(error) && error.code === statusCodes.SIGN_IN_CANCELLED) return CANCELLED;
    throw error;
  }
  if (!idToken) throw new Error('Google did not return a sign-in token.');

  const { error } = await supabase.auth.signInWithIdToken({ provider: 'google', token: idToken });
  if (error) throw error;
}

// ---- Sign out --------------------------------------------------------------

/** Signs out on this phone only (other devices stay signed in). */
export async function signOut(): Promise<void> {
  if (isGoogleSignInAvailable) {
    // So the Google account picker shows again next time.
    const { GoogleSignin } = await loadGoogleSignIn();
    await GoogleSignin.signOut().catch(() => undefined);
  }
  await supabase.auth.signOut({ scope: 'local' });
}

/** A friendly message for sign-in errors from Supabase, Apple or Google. */
export function describeAuthError(error: unknown): string {
  const code = (error as { code?: string })?.code;
  switch (code) {
    case 'invalid_credentials':
      return 'Wrong email or password.';
    case 'email_not_confirmed':
      return 'Please confirm your email first. Check your inbox for the link.';
    case 'user_already_exists':
    case 'email_exists':
      return 'An account with this email already exists. Try signing in.';
    case 'weak_password':
      return 'Please choose a stronger password (at least 8 characters).';
    case 'same_password':
      return 'Your new password must be different from your old one.';
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return 'Too many attempts. Please wait a minute and try again.';
  }
  const message = (error as { message?: string })?.message;
  return message || 'Something went wrong. Please try again.';
}
