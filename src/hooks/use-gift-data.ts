/**
 * React Query hooks: they load data from Supabase, cache it, and refresh the
 * screens that show it after a change (for example, saving a gift updates both
 * the results list and the Saved tab).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import * as api from '@/lib/api';
import type { GiftSuggestion, Preferences } from '@/lib/types';

export const queryKeys = {
  allowance: ['allowance'] as const,
  preferences: ['preferences'] as const,
  searches: ['searches'] as const,
  search: (id: string) => ['search', id] as const,
  savedGifts: ['saved-gifts'] as const,
  productImage: (suggestionId: string) => ['product-image', suggestionId] as const,
};

export function useAllowance() {
  return useQuery({ queryKey: queryKeys.allowance, queryFn: api.fetchAllowance });
}

export function usePreferences() {
  return useQuery({ queryKey: queryKeys.preferences, queryFn: api.fetchPreferences });
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.updatePreferences,
    // Show the change right away; undo it if saving fails.
    onMutate: async (changes) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.preferences });
      const previous = queryClient.getQueryData<Preferences>(queryKeys.preferences);
      if (previous) queryClient.setQueryData(queryKeys.preferences, { ...previous, ...changes });
      return { previous };
    },
    onError: (_error, _changes, context) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.preferences, context.previous);
    },
  });
}

export function useSearches() {
  return useQuery({ queryKey: queryKeys.searches, queryFn: api.fetchSearches });
}

export function useSearch(searchId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.search(searchId ?? ''),
    queryFn: () => api.fetchSearch(searchId!),
    enabled: !!searchId,
  });
}

export function useGenerateGifts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.generateGifts,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.allowance });
      queryClient.invalidateQueries({ queryKey: queryKeys.searches });
    },
  });
}

export function useDeleteSearch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteSearch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.searches });
      // Saved gifts from that search are deleted with it.
      queryClient.invalidateQueries({ queryKey: queryKeys.savedGifts });
    },
  });
}

export function useSimilarGifts(searchId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.fetchSimilarGifts,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.search(searchId) }),
  });
}

export function useProductImage(gift: GiftSuggestion) {
  return useQuery({
    queryKey: queryKeys.productImage(gift.id),
    queryFn: () => api.fetchProductImage(gift.id),
    enabled: !gift.image_url && gift.shopping_source === 'amazon',
    staleTime: Infinity,
    retry: false,
  });
}

export function useSavedGifts() {
  return useQuery({ queryKey: queryKeys.savedGifts, queryFn: api.fetchSavedGifts });
}

/** The ids of every saved suggestion, for drawing filled hearts. */
export function useSavedIds(): Set<string> {
  const { data } = useSavedGifts();
  return new Set(data?.map((saved) => saved.suggestion_id));
}

export function useToggleSaved() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ suggestionId, save }: { suggestionId: string; save: boolean }) =>
      save ? api.saveGifts([suggestionId]) : api.unsaveGift(suggestionId),
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.savedGifts }),
  });
}

export function useSaveAll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.saveGifts,
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.savedGifts }),
  });
}

export function useDeleteAccount() {
  return useMutation({ mutationFn: api.deleteAccount });
}
