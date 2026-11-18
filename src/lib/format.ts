import type { User } from '@supabase/supabase-js';
import { Alert } from 'react-native';

import type { Allowance, GiftSearch } from '@/lib/types';

/** First name from sign-up, Apple or Google; falls back to the email. */
export function firstName(user: User | undefined): string {
  const meta = user?.user_metadata ?? {};
  const name: string =
    meta.first_name || meta.given_name || String(meta.full_name || meta.name || '').split(' ')[0];
  return name || user?.email?.split('@')[0] || 'there';
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

/** "Age 26-35 · Friend · Birthday · $25 - $125" */
export function describeSearch(search: GiftSearch): string {
  return [`Age ${search.recipient_age}`, search.relationship, search.occasion, search.budget].join(' · ');
}

export function hasSearchesLeft(allowance: Allowance | undefined): boolean {
  // While the allowance is still loading, let the server decide.
  return !allowance || allowance.free_remaining > 0 || allowance.credits > 0;
}

export function alertOutOfSearches(allowance: Allowance | undefined) {
  const resets = allowance ? ` Your free searches come back on ${formatDate(allowance.resets_at)}.` : '';
  Alert.alert('Out of free searches', `You've used all your free gift searches for this month.${resets}`);
}
