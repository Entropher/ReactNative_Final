import * as AppleAuthentication from 'expo-apple-authentication';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { CANCELLED, describeAuthError, isAppleSignInAvailable, signInWithApple } from '@/lib/auth';

/** "Sign in with Apple" button (iPhone only). */
export function SocialSignIn() {
  const theme = useTheme();
  const isDark = useColorScheme() === 'dark';
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    isAppleSignInAvailable().then(setAppleAvailable);
  }, []);

  if (!appleAvailable) return null;

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.md },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  line: { flex: 1, height: StyleSheet.hairlineWidth },
  appleButton: { width: '100%', height: 50 },
});
