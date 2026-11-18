import { Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { describeSearch, formatDate } from '@/lib/format';
import type { GiftSearch } from '@/lib/types';

type SearchRowProps = {
  search: GiftSearch;
  onPress: () => void;
  /** Extra buttons shown under the summary (History tab). */
  actions?: React.ReactNode;
};

export function SearchRow({ search, onPress, actions }: SearchRowProps) {
  const theme = useTheme();
  return (
    <Card>
      <Pressable accessibilityRole="button" onPress={onPress} style={styles.row}>
        <View style={styles.text}>
          <AppText variant="label" numberOfLines={1}>
            {search.title}
          </AppText>
          <AppText variant="caption" tone="muted">
            {formatDate(search.created_at)}
          </AppText>
          <AppText variant="caption" numberOfLines={2}>
            {describeSearch(search)}
          </AppText>
        </View>
        <Icon name="chevronRight" size={16} color={theme.textMuted} />
      </Pressable>
      {actions ? <View style={styles.actions}>{actions}</View> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  text: { flex: 1, gap: 2 },
  actions: { flexDirection: 'row', gap: Spacing.sm },
});
