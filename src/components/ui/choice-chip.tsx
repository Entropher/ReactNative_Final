import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ChoiceChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** Shown above the label, e.g. the age emoji. */
  emoji?: string;
};

/** A selectable answer button, filled when chosen. */
export function ChoiceChip({ label, selected, onPress, emoji }: ChoiceChipProps) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        emoji ? styles.tall : null,
        {
          backgroundColor: selected ? theme.primary : theme.card,
          borderColor: selected ? theme.primary : theme.border,
          opacity: pressed ? 0.8 : 1,
        },
      ]}>
      {emoji ? <AppText style={styles.emoji}>{emoji}</AppText> : null}
      <AppText variant="caption" style={{ color: selected ? theme.onPrimary : theme.text, fontWeight: '600' }}>
        {label}
      </AppText>
    </Pressable>
  );
}

/** Lays chips out in a wrapping row. */
export function ChipGroup({ children }: { children: React.ReactNode }) {
  return <View style={styles.group}>{children}</View>;
}

const styles = StyleSheet.create({
  group: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
  },
  tall: { minWidth: 76, paddingVertical: Spacing.md },
  emoji: { fontSize: 24, lineHeight: 30, marginBottom: 2 },
});
