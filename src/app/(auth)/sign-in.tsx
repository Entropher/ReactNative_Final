import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/screen';
import { SocialSignIn } from '@/components/social-sign-in';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TextField } from '@/components/ui/text-field';
import { AppText } from '@/components/ui/text';
import { Spacing } from '@/constants/theme';
import { describeAuthError, resendConfirmationEmail, signInWithEmail } from '@/lib/auth';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    setError('');
    setNeedsConfirmation(false);
    try {
      // On success the app switches to the signed-in screens by itself.
      await signInWithEmail(email.trim(), password);
    } catch (e) {
      setError(describeAuthError(e));
      setNeedsConfirmation((e as { code?: string }).code === 'email_not_confirmed');
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    try {
      await resendConfirmationEmail(email.trim());
      Alert.alert('Email sent', `We sent a new confirmation link to ${email.trim()}.`);
    } catch (e) {
      Alert.alert("Couldn't send the email", describeAuthError(e));
    }
  };

  return (
    <Screen>
      <AppText variant="heading">Welcome back</AppText>
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
        />
        <TextField
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="Your password"
          secureTextEntry
          autoComplete="current-password"
          textContentType="password"
          onSubmitEditing={submit}
        />
        {error ? (
          <AppText variant="caption" tone="danger">
            {error}
          </AppText>
        ) : null}
        {needsConfirmation ? (
          <Button title="Resend confirmation email" variant="ghost" size="sm" icon="mail" onPress={resend} />
        ) : null}
        <Button title="Sign In" onPress={submit} loading={loading} />
        <Button
          title="Forgot password?"
          variant="ghost"
          size="sm"
          onPress={() => router.push({ pathname: '/forgot-password', params: { email: email.trim() } })}
        />
      </Card>

      <SocialSignIn />

      <View style={styles.footer}>
        <AppText tone="muted">Don&apos;t have an account?</AppText>
        <Button title="Create one" variant="ghost" size="sm" onPress={() => router.replace('/sign-up')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs },
});
