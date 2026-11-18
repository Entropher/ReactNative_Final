import { FunctionsFetchError, FunctionsHttpError } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';
import type {
  Allowance,
  GiftSearch,
  GiftSuggestion,
  Preferences,
  SavedGift,
  SurveyAnswers,
} from '@/lib/types';

/** An error with a message that is safe to show to the user. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly code?: string,
  ) {
    super(message);
  }
}

function fail(error: { message: string }): never {
  console.warn('Supabase error:', error.message);
  throw new ApiError('Something went wrong. Please try again.');
}

async function currentUserId(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const id = data.session?.user.id;
  if (!id) throw new ApiError('Please sign in again.');
  return id;
}

/** Calls one of the Edge Functions in supabase/functions. */
async function callFunction<T>(name: string, body?: object): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body: body ?? {} });
  if (!error) return data as T;

  if (error instanceof FunctionsHttpError) {
    let payload: { error?: string; code?: string } = {};
    try {
      payload = await error.context.json();
    } catch {
      // Not JSON; fall back to the generic message.
    }
    throw new ApiError(payload.error ?? 'Something went wrong. Please try again.', payload.code);
  }
  if (error instanceof FunctionsFetchError) {
    throw new ApiError("Couldn't reach GiftMaster. Check your internet connection and try again.");
  }
  return fail(error);
}

// ---- Account ---------------------------------------------------------------

export async function fetchAllowance(): Promise<Allowance> {
  const { data, error } = await supabase.rpc('get_my_allowance').single();
  if (error) fail(error);
  return data as Allowance;
}

export async function fetchPreferences(): Promise<Preferences> {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('theme, default_budget')
    .maybeSingle();
  if (error) fail(error);
  return (data as Preferences | null) ?? { theme: 'system', default_budget: null };
}

export async function updatePreferences(changes: Partial<Preferences>): Promise<void> {
  const userId = await currentUserId();
  const { error } = await supabase.from('user_preferences').update(changes).eq('user_id', userId);
  if (error) fail(error);
}

export async function deleteAccount(): Promise<void> {
  await callFunction('delete-account');
}

// ---- Searches --------------------------------------------------------------

export async function fetchSearches(): Promise<GiftSearch[]> {
  const { data, error } = await supabase
    .from('gift_searches')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) fail(error);
  return data as GiftSearch[];
}

export async function fetchSearch(
  searchId: string,
): Promise<{ search: GiftSearch; suggestions: GiftSuggestion[] }> {
  const [searchResult, suggestionsResult] = await Promise.all([
    supabase.from('gift_searches').select('*').eq('id', searchId).maybeSingle(),
    supabase
      .from('gift_suggestions')
      .select('*')
      .eq('search_id', searchId)
      .order('created_at')
      .order('id'),
  ]);
  if (searchResult.error) fail(searchResult.error);
  if (suggestionsResult.error) fail(suggestionsResult.error);
  if (!searchResult.data) throw new ApiError('This search no longer exists.', 'NOT_FOUND');
  return {
    search: searchResult.data as GiftSearch,
    suggestions: suggestionsResult.data as GiftSuggestion[],
  };
}

export async function deleteSearch(searchId: string): Promise<void> {
  const { error } = await supabase.from('gift_searches').delete().eq('id', searchId);
  if (error) fail(error);
}

/** Runs the AI. Throws ApiError with code NO_CREDITS when the allowance is used up. */
export async function generateGifts(answers: SurveyAnswers): Promise<{ searchId: string }> {
  return callFunction('generate-gifts', answers);
}

export async function fetchSimilarGifts(suggestionId: string): Promise<GiftSuggestion[]> {
  const { suggestions } = await callFunction<{ suggestions: GiftSuggestion[] }>('similar-gifts', {
    suggestionId,
  });
  return suggestions;
}

export async function fetchProductImage(suggestionId: string): Promise<string | null> {
  const { imageUrl } = await callFunction<{ imageUrl: string | null }>('product-image', {
    suggestionId,
  });
  return imageUrl;
}

// ---- Saved gifts -----------------------------------------------------------

export async function fetchSavedGifts(): Promise<SavedGift[]> {
  const { data, error } = await supabase
    .from('saved_gifts')
    .select('id, suggestion_id, created_at, suggestion:gift_suggestions(*)')
    .order('created_at', { ascending: false });
  if (error) fail(error);
  return data as unknown as SavedGift[];
}

export async function saveGifts(suggestionIds: string[]): Promise<void> {
  const userId = await currentUserId();
  const { error } = await supabase.from('saved_gifts').upsert(
    suggestionIds.map((suggestion_id) => ({ user_id: userId, suggestion_id })),
    { onConflict: 'user_id,suggestion_id', ignoreDuplicates: true },
  );
  if (error) fail(error);
}

export async function unsaveGift(suggestionId: string): Promise<void> {
  const userId = await currentUserId();
  const { error } = await supabase
    .from('saved_gifts')
    .delete()
    .eq('user_id', userId)
    .eq('suggestion_id', suggestionId);
  if (error) fail(error);
}
