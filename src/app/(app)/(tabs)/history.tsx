import { router } from 'expo-router';
import { ActivityIndicator, Alert } from 'react-native';

import { Screen } from '@/components/screen';
import { SearchRow } from '@/components/search-row';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AppText } from '@/components/ui/text';
import { useDeleteSearch, useSearches } from '@/hooks/use-gift-data';
import { useStartSearch } from '@/hooks/use-start-search';
import { useTheme } from '@/hooks/use-theme';
import type { GiftSearch } from '@/lib/types';

export default function HistoryScreen() {
  const theme = useTheme();
  const { data: searches, isLoading } = useSearches();
  const deleteSearch = useDeleteSearch();
  const { startNew, startFromSearch } = useStartSearch();

  const confirmDelete = (search: GiftSearch) =>
    Alert.alert('Delete this search?', 'Its gift ideas, and any of them you saved, will be removed.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          deleteSearch.mutate(search.id, {
            onError: (error) => Alert.alert("Couldn't delete", error.message),
          }),
      },
    ]);

  return (
    <Screen withTopInset>
      <AppText variant="title">Search History</AppText>

      {isLoading ? <ActivityIndicator color={theme.primary} /> : null}

      {searches?.length === 0 ? (
        <Card>
          <AppText variant="subheading">No searches yet</AppText>
          <AppText tone="muted">Your past gift searches will appear here so you can revisit them.</AppText>
          <Button title="Start a Search" icon="sparkles" onPress={startNew} />
        </Card>
      ) : null}

      {searches?.map((search) => (
        <SearchRow
          key={search.id}
          search={search}
          onPress={() => router.push({ pathname: '/results/[id]', params: { id: search.id } })}
          actions={
            <>
              <Button
                title="Use again"
                icon="refresh"
                variant="outline"
                size="sm"
                onPress={() => startFromSearch(search)}
                style={{ flex: 1 }}
              />
              <Button
                title="Delete"
                icon="trash"
                variant="danger"
                size="sm"
                onPress={() => confirmDelete(search)}
                style={{ flex: 1 }}
              />
            </>
          }
        />
      ))}
    </Screen>
  );
}
