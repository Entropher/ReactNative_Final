import { useState } from 'react';
import { Alert } from 'react-native';

import { Screen } from '@/components/screen';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TextField } from '@/components/ui/text-field';
import { AppText } from '@/components/ui/text';
import { describeAuthError, signOut, updatePassword } from '@/lib/auth';
import { useAuth } from '@/providers/auth-provider';

/** Opened from the "reset password" email link. */
export default function SetNewPasswordScreen() {
  const { finishPasswordReset } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const found: Record<string, string> = {};
    if (password.length < 8) found.password = 'Password must be at least 8 characters.';
    else if (confirm !== password) found.confirm = "The passwords don't match.";
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    try {
      await updatePassword(password);
      Alert.alert('Password updated', 'Your new password is saved.');
      finishPasswordReset(); // opens the rest of the app
    } catch (e) {
      setErrors({ form: describeAuthError(e) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <AppText variant="heading">Choose a new password</AppText>
      <Card>
        <TextField
          label="New password"
          value={password}
          onChangeText={setPassword}
          placeholder="At least 8 characters"
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
          error={errors.password}
        />
        <TextField
          label="Confirm new password"
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
          onSubmitEditing={save}
          error={errors.confirm}
        />
        {errors.form ? (
          <AppText variant="caption" tone="danger">
            {errors.form}
          </AppText>
        ) : null}
        <Button title="Save Password" onPress={save} loading={saving} />
      </Card>
      <Button title="Cancel and sign out" variant="ghost" onPress={() => signOut()} />
    </Screen>
  );
}
