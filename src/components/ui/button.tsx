import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** `inverse` is a white button for use on the pink/purple gradient. */
type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'inverse';

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: Variant;
  size?: 'md' | 'sm';
  icon?: IconName;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  style,
}: ButtonProps) {
  const theme = useTheme();

  const colors = {
    primary: { bg: theme.primary, fg: theme.onPrimary, border: theme.primary },
    secondary: { bg: theme.secondary, fg: theme.onPrimary, border: theme.secondary },
    outline: { bg: 'transparent', fg: theme.text, border: theme.border },
    ghost: { bg: 'transparent', fg: theme.primary, border: 'transparent' },
    danger: { bg: 'transparent', fg: theme.danger, border: theme.danger },
    inverse: { bg: '#FFFFFF', fg: '#E11D48', border: '#FFFFFF' },
  }[variant];

  const isDisabled = disabled || loading;
  const iconNode = icon ? <Icon name={icon} size={size === 'sm' ? 16 : 18} color={colors.fg} /> : null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        size === 'sm' ? styles.sm : styles.md,
        { backgroundColor: colors.bg, borderColor: colors.border },
        (pressed || isDisabled) && { opacity: isDisabled ? 0.5 : 0.8 },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={colors.fg} />
      ) : (
        <View style={styles.content}>
          {iconPosition === 'left' && iconNode}
          <AppText
            variant={size === 'sm' ? 'caption' : 'label'}
            style={{ color: colors.fg, fontWeight: '600' }}
            numberOfLines={1}>
            {title}
          </AppText>
          {iconPosition === 'right' && iconNode}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  md: { minHeight: 50, paddingHorizontal: Spacing.lg },
  sm: { minHeight: 38, paddingHorizontal: Spacing.md },
  content: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
});
