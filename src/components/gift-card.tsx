import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import { useState } from 'react';
import { Pressable, Share, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useProductImage } from '@/hooks/use-gift-data';
import { useTheme } from '@/hooks/use-theme';
import { getShoppingLink } from '@/lib/shopping';
import type { GiftSuggestion } from '@/lib/types';

type GiftCardProps = {
  gift: GiftSuggestion;
  saved: boolean;
  onToggleSave: () => void;
  /** Leave out to hide the "More Like This" button (e.g. on the Saved tab). */
  onMoreLikeThis?: () => void;
  moreLikeThisLoading?: boolean;
};

export function GiftCard({ gift, saved, onToggleSave, onMoreLikeThis, moreLikeThisLoading }: GiftCardProps) {
  const theme = useTheme();
  const shopping = getShoppingLink(gift);

  const share = () =>
    Share.share({
      message: `Gift idea: ${gift.title}\n\n${gift.description}\n\n${shopping.url}`,
    });

  return (
    <Card style={styles.card}>
      <View>
        <ProductImage gift={gift} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={saved ? 'Remove from saved gifts' : 'Save gift'}
          onPress={onToggleSave}
          hitSlop={8}
          style={[styles.heart, { backgroundColor: theme.card }]}>
          <Icon name={saved ? 'heartFilled' : 'heart'} size={20} color={theme.primary} />
        </Pressable>
      </View>

      <View style={styles.body}>
        <AppText variant="subheading">{gift.title}</AppText>
        <AppText tone="muted">{gift.description}</AppText>

        <View style={styles.tags}>
          <View style={[styles.tag, { backgroundColor: theme.accentSoft }]}>
            <AppText variant="caption" style={{ color: theme.accent, fontWeight: '700' }}>
              {gift.budget_range}
            </AppText>
          </View>
          {gift.category ? (
            <View style={[styles.tag, { backgroundColor: theme.muted }]}>
              <AppText variant="caption" tone="muted">
                {gift.category}
              </AppText>
            </View>
          ) : null}
        </View>

        <Button
          title={shopping.label}
          icon="external"
          iconPosition="right"
          onPress={() => Linking.openURL(shopping.url)}
        />
        <View style={styles.row}>
          {onMoreLikeThis ? (
            <Button
              title="More Like This"
              icon="sparkles"
              variant="outline"
              size="sm"
              loading={moreLikeThisLoading}
              onPress={onMoreLikeThis}
              style={styles.flex}
            />
          ) : null}
          <Button title="Share" icon="share" variant="outline" size="sm" onPress={share} style={styles.flex} />
        </View>
      </View>
    </Card>
  );
}

function ProductImage({ gift }: { gift: GiftSuggestion }) {
  const theme = useTheme();
  const { data: foundUrl, isLoading } = useProductImage(gift);
  const [failed, setFailed] = useState(false);
  const url = gift.image_url ?? foundUrl;

  return (
    <View style={[styles.imageBox, { backgroundColor: theme.muted }]}>
      {url && !failed ? (
        <Image
          source={url}
          style={StyleSheet.absoluteFill}
          contentFit="contain"
          transition={200}
          accessibilityLabel={gift.title}
          onError={() => setFailed(true)}
        />
      ) : isLoading ? null : (
        <Icon name="gift" size={56} color={theme.border} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 0, overflow: 'hidden', gap: 0 },
  imageBox: {
    height: 190,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heart: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.15)',
  },
  body: { padding: Spacing.lg, gap: Spacing.md },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  tag: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.pill },
  row: { flexDirection: 'row', gap: Spacing.sm },
  flex: { flex: 1 },
});
