import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { Screen } from '@/components/screen';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { TextField } from '@/components/ui/text-field';
import { AppText } from '@/components/ui/text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { describeAuthError, isValidEmail, sendPasswordResetEmail } from '@/lib/auth';

export default function ForgotPasswordScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(params.email ?? '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const send = async () => {
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await sendPasswordResetEmail(email.trim());
      setSentTo(email.trim());
    } catch (e) {
      setError(describeAuthError(e));
    } finally {
      setLoading(false);
    }
  };

  if (sentTo) {
    return (
      <Screen>
        <Card style={styles.sent}>
          <Icon name="mail" size={44} color={theme.primary} />
          <AppText variant="heading" style={styles.center}>
            Check your email
          </AppText>
          {/* Supabase doesn't say whether the account exists, so neither do we. */}
          <AppText tone="muted" style={styles.center}>
            If there&apos;s an account for {sentTo}, we sent it a link to reset the password. Open
            the link on this phone.
          </AppText>
          <Button title="Back to sign in" variant="outline" onPress={() => router.back()} style={styles.full} />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <AppText variant="heading">Reset your password</AppText>
      <AppText tone="muted">Enter your account&apos;s email and we&apos;ll send you a link to choose a new password.</AppText>
      <Card>
        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          onSubmitEditing={send}
          error={error}
        />
        <Button title="Send Reset Link" icon="mail" onPress={send} loading={loading} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sent: { alignItems: 'center', paddingVertical: Spacing.xxl },
  center: { textAlign: 'center' },
  full: { alignSelf: 'stretch' },
});
