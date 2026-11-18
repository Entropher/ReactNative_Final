import { SymbolView } from 'expo-symbols';
import type { ColorValue } from 'react-native';

/**
 * The icons GiftMaster uses: SF Symbols on iOS, Material icons on Android.
 * Add new ones here so both platforms always have a match.
 */
const ICONS = {
  gift: { ios: 'gift.fill', android: 'redeem' },
  heart: { ios: 'heart', android: 'favorite_border' },
  heartFilled: { ios: 'heart.fill', android: 'favorite' },
  sparkles: { ios: 'sparkles', android: 'auto_awesome' },
  share: { ios: 'square.and.arrow.up', android: 'share' },
  external: { ios: 'arrow.up.right.square', android: 'open_in_new' },
  trash: { ios: 'trash', android: 'delete' },
  history: { ios: 'clock.arrow.circlepath', android: 'history' },
  settings: { ios: 'gearshape', android: 'settings' },
  home: { ios: 'house', android: 'home' },
  arrowRight: { ios: 'arrow.right', android: 'arrow_forward' },
  arrowLeft: { ios: 'arrow.left', android: 'arrow_back' },
  check: { ios: 'checkmark', android: 'check' },
  plus: { ios: 'plus', android: 'add' },
  refresh: { ios: 'arrow.clockwise', android: 'refresh' },
  bookmark: { ios: 'bookmark', android: 'bookmark_border' },
  mail: { ios: 'envelope', android: 'mail' },
  person: { ios: 'person.crop.circle', android: 'person' },
  logout: { ios: 'rectangle.portrait.and.arrow.right', android: 'logout' },
  info: { ios: 'info.circle', android: 'info' },
  chevronRight: { ios: 'chevron.right', android: 'chevron_right' },
  tune: { ios: 'slider.horizontal.3', android: 'tune' },
  palette: { ios: 'paintpalette', android: 'palette' },
  celebration: { ios: 'party.popper', android: 'celebration' },
} as const;

export type IconName = keyof typeof ICONS;

export function Icon({ name, size = 20, color }: { name: IconName; size?: number; color: ColorValue }) {
  return <SymbolView name={ICONS[name]} size={size} tintColor={color} />;
}
