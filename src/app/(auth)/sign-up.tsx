import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/screen';
import { SocialSignIn } from '@/components/social-sign-in';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { TextField } from '@/components/ui/text-field';
import { AppText } from '@/components/ui/text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { describeAuthError, resendConfirmationEmail, signUpWithEmail } from '@/lib/auth';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignUpScreen() {
  const theme = useTheme();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const submit = async () => {
    const found: Record<string, string> = {};
    if (!firstName.trim()) found.firstName = 'First name is required.';
    if (!EMAIL_PATTERN.test(email.trim())) found.email = 'Please enter a valid email address.';
    if (password.length < 8) found.password = 'Password must be at least 8 characters.';
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setLoading(true);
    try {
      const { needsConfirmation } = await signUpWithEmail({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
      });
      // Without email confirmation the user is signed in and the app moves on by itself.
      if (needsConfirmation) setSentTo(email.trim());
    } catch (e) {
      setErrors({ form: describeAuthError(e) });
    } finally {
      setLoading(false);
    }
  };

  if (sentTo) {
    const resend = async () => {
      try {
        await resendConfirmationEmail(sentTo);
        Alert.alert('Email sent', `We sent a new confirmation link to ${sentTo}.`);
      } catch (e) {
        Alert.alert("Couldn't send the email", describeAuthError(e));
      }
    };
    return (
      <Screen>
        <Card style={styles.sent}>
          <Icon name="mail" size={44} color={theme.primary} />
          <AppText variant="heading" style={styles.center}>
            Check your email
          </AppText>
          <AppText tone="muted" style={styles.center}>
            We sent a confirmation link to {sentTo}. Open it on this phone to finish creating your account.
          </AppText>
          <Button title="Resend email" variant="outline" onPress={resend} style={styles.full} />
          <Button title="Back to sign in" variant="ghost" onPress={() => router.replace('/sign-in')} />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <AppText variant="heading">Create your account</AppText>
      <AppText tone="muted">Every account gets free gift searches each month.</AppText>
      <Card>
        <TextField
          label="First name"
          value={firstName}
          onChangeText={setFirstName}
          autoComplete="given-name"
          textContentType="givenName"
          error={errors.firstName}
        />
        <TextField
          label="Last name (optional)"
          value={lastName}
          onChangeText={setLastName}
          autoComplete="family-name"
          textContentType="familyName"
        />
        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          error={errors.email}
        />
        <TextField
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="At least 8 characters"
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
          error={errors.password}
        />
        {errors.form ? (
          <AppText variant="caption" tone="danger">
            {errors.form}
          </AppText>
        ) : null}
        <Button title="Create Account" onPress={submit} loading={loading} />
      </Card>

      <SocialSignIn />

      <View style={styles.footer}>
        <AppText tone="muted">Already have an account?</AppText>
        <Button title="Sign in" variant="ghost" size="sm" onPress={() => router.replace('/sign-in')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sent: { alignItems: 'center', paddingVertical: Spacing.xxl },
  center: { textAlign: 'center' },
  full: { alignSelf: 'stretch' },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs },
});
