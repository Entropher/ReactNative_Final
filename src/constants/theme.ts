/**
 * GiftMaster colors, taken from the website (client/src/index.css):
 * coral-pink primary, purple secondary, amber accent.
 */
export const Colors = {
  light: {
    background: '#FBFAF9',
    card: '#FFFFFF',
    text: '#0F172A',
    textMuted: '#6B7280',
    border: '#E5E7EB',
    muted: '#F3F4F6',
    primary: '#FB6A7D',
    primarySoft: '#FFE4E8',
    secondary: '#7C3AED',
    secondarySoft: '#EDE4FD',
    accent: '#F59E0B',
    accentSoft: '#FEF3C7',
    onPrimary: '#FFFFFF',
    danger: '#DC2626',
  },
  dark: {
    background: '#000000',
    card: '#16171A',
    text: '#E7E9EA',
    textMuted: '#8B9096',
    border: '#2F3336',
    muted: '#1F2023',
    primary: '#FB6A7D',
    primarySoft: '#3A1D23',
    secondary: '#8B5CF6',
    secondarySoft: '#2A1F45',
    accent: '#F59E0B',
    accentSoft: '#3A2A0B',
    onPrimary: '#FFFFFF',
    danger: '#F87171',
  },
} as const;

export type ThemeColors = { [K in keyof typeof Colors.light]: string };

/** The website's hero gradient: primary to secondary. */
export const BrandGradient = ['#FB6A7D', '#7C3AED'] as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;
