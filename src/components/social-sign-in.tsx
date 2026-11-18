import type { GoogleSigninButton as GoogleSigninButtonType } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import {
  CANCELLED,
  describeAuthError,
  isAppleSignInAvailable,
  isGoogleSignInAvailable,
  signInWithApple,
  signInWithGoogle,
} from '@/lib/auth';

/** "Sign in with Apple" (iPhone) and "Sign in with Google" buttons. */
export function SocialSignIn() {
  const theme = useTheme();
  const isDark = useColorScheme() === 'dark';
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [GoogleButton, setGoogleButton] = useState<typeof GoogleSigninButtonType | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    isAppleSignInAvailable().then(setAppleAvailable);
    if (isGoogleSignInAvailable) {
      // Loaded on demand: this native module isn't in the Expo Go app.
      import('@react-native-google-signin/google-signin').then((module) =>
        setGoogleButton(() => module.GoogleSigninButton),
      );
    }
  }, []);

  if (!appleAvailable && !GoogleButton) return null;

  const run = async (signIn: () => Promise<typeof CANCELLED | void>) => {
    if (busy) return;
    setBusy(true);
    try {
      await signIn();
    } catch (error) {
      Alert.alert('Sign-in failed', describeAuthError(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.dividerRow}>
        <View style={[styles.line, { backgroundColor: theme.border }]} />
        <AppText variant="caption" tone="muted">
          or
        </AppText>
        <View style={[styles.line, { backgroundColor: theme.border }]} />
      </View>

      {appleAvailable ? (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
          buttonStyle={
            isDark
              ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
              : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
          }
          cornerRadius={Radius.md}
          style={styles.appleButton}
          onPress={() => run(signInWithApple)}
        />
      ) : null}

      {GoogleButton ? (
        <GoogleButton
          size={GoogleButton.Size.Wide}
          color={isDark ? 'light' : 'dark'}
          disabled={busy}
          onPress={() => run(signInWithGoogle)}
          style={styles.googleButton}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.md },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  line: { flex: 1, height: StyleSheet.hairlineWidth },
  appleButton: { width: '100%', height: 50 },
  googleButton: { width: '100%', height: 50 },
});
