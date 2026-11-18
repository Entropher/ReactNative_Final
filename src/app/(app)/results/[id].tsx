import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, View } from 'react-native';

import { GiftCard } from '@/components/gift-card';
import { Screen } from '@/components/screen';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AppText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useSaveAll, useSavedIds, useSearch, useSimilarGifts, useToggleSaved } from '@/hooks/use-gift-data';
import { useStartSearch } from '@/hooks/use-start-search';
import { useTheme } from '@/hooks/use-theme';

export default function ResultsScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, error } = useSearch(id);
  const savedIds = useSavedIds();
  const toggleSaved = useToggleSaved();
  const saveAll = useSaveAll();
  const similar = useSimilarGifts(id);
  const { startNew } = useStartSearch();
  const [similarFor, setSimilarFor] = useState<string | null>(null);

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.primary} size="large" />
      </View>
    );
  }

  if (error || !data) {
    return (
      <Screen>
        <Card>
          <AppText variant="heading">Search not found</AppText>
          <AppText tone="muted">This gift search doesn&apos;t exist or has been deleted.</AppText>
          <Button title="Start a New Search" onPress={startNew} />
        </Card>
      </Screen>
    );
  }

  const { search, suggestions } = data;

  const moreLikeThis = (suggestionId: string) => {
    setSimilarFor(suggestionId);
    similar.mutate(suggestionId, {
      onSuccess: (added) =>
        Alert.alert('More ideas added', `${added.length} similar gift ideas were added to the end of this list.`),
      onError: (e) => Alert.alert("Couldn't get more ideas", e.message),
      onSettled: () => setSimilarFor(null),
    });
  };

  const header = (
    <View style={styles.header}>
      <AppText variant="title">Perfect Gift Ideas</AppText>
      <AppText tone="muted">
        For a <AppText style={styles.bold}>{search.recipient_age}</AppText> year old{' '}
        <AppText style={styles.bold}>{search.relationship.toLowerCase()}</AppText> who loves{' '}
        <AppText style={styles.bold}>{search.interests}</AppText>
      </AppText>
      <View style={styles.tags}>
        <View style={[styles.tag, { backgroundColor: theme.muted }]}>
          <AppText variant="caption">Budget: {search.budget}</AppText>
        </View>
        <View style={[styles.tag, { backgroundColor: theme.muted }]}>
          <AppText variant="caption">{search.occasion}</AppText>
        </View>
      </View>
      <View style={styles.buttons}>
        <Button
          title="Save All"
          icon="bookmark"
          variant="secondary"
          size="sm"
          loading={saveAll.isPending}
          onPress={() =>
            saveAll.mutate(
              suggestions.map((s) => s.id),
              {
                onSuccess: () => Alert.alert('All gifts saved!', 'Find them any time in the Saved tab.'),
                onError: (e) => Alert.alert("Couldn't save", e.message),
              },
            )
          }
          style={styles.flex}
        />
        <Button title="New Search" icon="tune" variant="outline" size="sm" onPress={startNew} style={styles.flex} />
      </View>
    </View>
  );

  const footer = (
    <View style={styles.footer}>
      <Button title="Generate More Ideas" icon="refresh" variant="outline" onPress={startNew} />
      <AppText variant="caption" tone="muted" style={styles.centerText}>
        Not satisfied? Try a new search with different details, or tap &quot;More Like This&quot; on an idea
        you like.
      </AppText>
    </View>
  );

  return (
    <FlatList
      data={suggestions}
      keyExtractor={(gift) => gift.id}
      style={{ backgroundColor: theme.background }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.list}
      ListHeaderComponent={header}
      ListFooterComponent={footer}
      ItemSeparatorComponent={() => <View style={{ height: Spacing.lg }} />}
      renderItem={({ item: gift }) => {
        const saved = savedIds.has(gift.id);
        return (
          <GiftCard
            gift={gift}
            saved={saved}
            onToggleSave={() =>
              toggleSaved.mutate(
                { suggestionId: gift.id, save: !saved },
                { onError: (e) => Alert.alert("Couldn't update saved gifts", e.message) },
              )
            }
            onMoreLikeThis={() => moreLikeThis(gift.id)}
            moreLikeThisLoading={similarFor === gift.id}
          />
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: Spacing.lg, paddingBottom: Spacing.xxl * 2 },
  header: { gap: Spacing.md, marginBottom: Spacing.lg },
  bold: { fontWeight: '700' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  tag: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.pill },
  buttons: { flexDirection: 'row', gap: Spacing.md },
  flex: { flex: 1 },
  footer: { marginTop: Spacing.xl, gap: Spacing.md },
  centerText: { textAlign: 'center' },
});
