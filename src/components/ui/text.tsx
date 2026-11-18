import { StyleSheet, Text, type TextProps } from 'react-native';

import type { ThemeColors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Variant = 'title' | 'heading' | 'subheading' | 'body' | 'label' | 'caption';
type Tone = 'default' | 'muted' | 'primary' | 'secondary' | 'onPrimary' | 'danger';

const TONE_COLOR: Record<Tone, keyof ThemeColors> = {
  default: 'text',
  muted: 'textMuted',
  primary: 'primary',
  secondary: 'secondary',
  onPrimary: 'onPrimary',
  danger: 'danger',
};

export type AppTextProps = TextProps & { variant?: Variant; tone?: Tone };

/** Text in the app's type scale and colors. */
export function AppText({ variant = 'body', tone = 'default', style, ...rest }: AppTextProps) {
  const theme = useTheme();
  return <Text style={[styles[variant], { color: theme[TONE_COLOR[tone]] }, style]} {...rest} />;
}

const styles = StyleSheet.create({
  title: { fontSize: 30, lineHeight: 36, fontWeight: '800' },
  heading: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
  subheading: { fontSize: 18, lineHeight: 24, fontWeight: '700' },
  body: { fontSize: 16, lineHeight: 23 },
  label: { fontSize: 16, lineHeight: 22, fontWeight: '600' },
  caption: { fontSize: 14, lineHeight: 20 },
});
