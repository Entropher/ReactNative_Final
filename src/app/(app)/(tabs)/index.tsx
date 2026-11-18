import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { BrandHero } from '@/components/brand-hero';
import { Screen } from '@/components/screen';
import { SearchRow } from '@/components/search-row';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { Spacing } from '@/constants/theme';
import { useAllowance, useSavedGifts, useSearches } from '@/hooks/use-gift-data';
import { useStartSearch } from '@/hooks/use-start-search';
import { useTheme } from '@/hooks/use-theme';
import { firstName, formatDate } from '@/lib/format';
import { useAuth } from '@/providers/auth-provider';

export default function HomeScreen() {
  const theme = useTheme();
  const { session } = useAuth();
  const { startNew } = useStartSearch();
  const { data: allowance } = useAllowance();
  const { data: searches } = useSearches();
  const { data: savedGifts } = useSavedGifts();

  return (
    <Screen withTopInset>
      <AppText variant="title">Hi, {firstName(session?.user)}</AppText>

      <BrandHero>
        <AppText variant="heading" tone="onPrimary">
          Ready to find the perfect gift?
        </AppText>
        <AppText tone="onPrimary">
          Answer a few questions and our AI will suggest 10 personalized gift ideas.
        </AppText>
        <Button title="Start a New Search" icon="sparkles" variant="inverse" onPress={startNew} />
      </BrandHero>

      {allowance ? (
        <Card style={styles.allowance}>
          <View style={[styles.allowanceIcon, { backgroundColor: theme.accentSoft }]}>
            <Icon name="gift" size={22} color={theme.accent} />
          </View>
          <View style={styles.flex}>
            <AppText variant="label">
              {allowance.free_remaining} of {allowance.free_limit} free searches left
            </AppText>
            <AppText variant="caption" tone="muted">
              {allowance.credits > 0 ? `Plus ${allowance.credits} credits. ` : ''}
              Free searches reset on {formatDate(allowance.resets_at)}.
            </AppText>
          </View>
        </Card>
      ) : null}

      <View style={styles.sectionHeader}>
        <AppText variant="subheading">Recent Searches</AppText>
        {searches && searches.length > 3 ? (
          <Button title="See all" variant="ghost" size="sm" onPress={() => router.navigate('/history')} />
        ) : null}
      </View>
      {searches?.length ? (
        searches
          .slice(0, 3)
          .map((search) => (
            <SearchRow
              key={search.id}
              search={search}
              onPress={() => router.push({ pathname: '/results/[id]', params: { id: search.id } })}
            />
          ))
      ) : (
        <AppText tone="muted">Your gift searches will show up here.</AppText>
      )}

      <View style={styles.sectionHeader}>
        <AppText variant="subheading">Saved Gifts</AppText>
        {savedGifts?.length ? (
          <Button title="See all" variant="ghost" size="sm" onPress={() => router.navigate('/saved')} />
        ) : null}
      </View>
      {savedGifts?.length ? (
        savedGifts.slice(0, 3).map((saved) => (
          <Card key={saved.id} style={styles.savedRow}>
            <Icon name="heartFilled" size={18} color={theme.primary} />
            <View style={styles.flex}>
              <AppText variant="label" numberOfLines={1}>
                {saved.suggestion.title}
              </AppText>
              <AppText variant="caption" tone="muted">
                {saved.suggestion.budget_range}
              </AppText>
            </View>
          </Card>
        ))
      ) : (
        <AppText tone="muted">Tap the heart on any gift idea to save it here.</AppText>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  allowance: { flexDirection: 'row', alignItems: 'center' },
  allowanceIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  savedRow: { flexDirection: 'row', alignItems: 'center' },
});
