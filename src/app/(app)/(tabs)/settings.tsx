import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/screen';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChipGroup, ChoiceChip } from '@/components/ui/choice-chip';
import { Icon, type IconName } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { Spacing } from '@/constants/theme';
import { useAllowance, useDeleteAccount, usePreferences, useUpdatePreferences } from '@/hooks/use-gift-data';
import { useTheme } from '@/hooks/use-theme';
import { signOut } from '@/lib/auth';
import { formatDate } from '@/lib/format';
import { BUDGET_PRESETS } from '@/lib/survey-options';
import type { Preferences, ThemePreference } from '@/lib/types';
import { useAuth } from '@/providers/auth-provider';

const THEMES: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

const SIGN_IN_METHODS: Record<string, string> = {
  email: 'Email and password',
  apple: 'Sign in with Apple',
};

export default function SettingsScreen() {
  const { session } = useAuth();
  const { data: allowance } = useAllowance();
  const { data: preferences } = usePreferences();
  const updatePreferences = useUpdatePreferences();
  const deleteAccount = useDeleteAccount();
  const [signingOut, setSigningOut] = useState(false);

  const user = session?.user;
  const provider = String(user?.app_metadata.provider ?? 'email');

  const change = (changes: Partial<Preferences>) =>
    updatePreferences.mutate(changes, {
      onError: () => Alert.alert("Couldn't save", 'Please check your connection and try again.'),
    });

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  };

  const confirmDelete = () =>
    Alert.alert(
      'Delete your account?',
      'This permanently deletes your account, search history and saved gifts. It cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: () =>
            deleteAccount.mutate(undefined, {
              onSuccess: () => signOut(),
              onError: (error) => Alert.alert("Couldn't delete your account", error.message),
            }),
        },
      ],
    );

  return (
    <Screen withTopInset>
      <AppText variant="title">Settings</AppText>

      <Section icon="person" title="Account">
        <Row label="Email" value={user?.email ?? '-'} />
        <Row label="Signed in with" value={SIGN_IN_METHODS[provider] ?? provider} />
        {allowance ? (
          <Row
            label="Free searches left"
            value={`${allowance.free_remaining} of ${allowance.free_limit} (resets ${formatDate(allowance.resets_at)})`}
          />
        ) : null}
        {allowance && allowance.credits > 0 ? <Row label="Credits" value={String(allowance.credits)} /> : null}
      </Section>

      <Section icon="palette" title="Appearance">
        <ChipGroup>
          {THEMES.map((option) => (
            <ChoiceChip
              key={option.value}
              label={option.label}
              selected={(preferences?.theme ?? 'system') === option.value}
              onPress={() => change({ theme: option.value })}
            />
          ))}
        </ChipGroup>
      </Section>

      <Section icon="gift" title="Default Budget">
        <AppText variant="caption" tone="muted">
          Pre-fills the budget when you start a new search.
        </AppText>
        <ChipGroup>
          <ChoiceChip
            label="No default"
            selected={!preferences?.default_budget}
            onPress={() => change({ default_budget: null })}
          />
          {BUDGET_PRESETS.map((preset) => (
            <ChoiceChip
              key={preset.label}
              label={preset.label}
              selected={preferences?.default_budget === preset.label}
              onPress={() => change({ default_budget: preset.label })}
            />
          ))}
        </ChipGroup>
      </Section>

      <Section icon="info" title="About">
        <Button title="Privacy Policy" variant="outline" size="sm" onPress={() => router.push('/privacy')} />
        <Button title="Terms of Service" variant="outline" size="sm" onPress={() => router.push('/terms')} />
      </Section>

      <Button title="Sign Out" icon="logout" variant="outline" loading={signingOut} onPress={handleSignOut} />
      <Button
        title="Delete Account"
        icon="trash"
        variant="danger"
        loading={deleteAccount.isPending}
        onPress={confirmDelete}
      />
    </Screen>
  );
}

function Section({ icon, title, children }: { icon: IconName; title: string; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <Card>
      <View style={styles.sectionTitle}>
        <Icon name={icon} size={20} color={theme.primary} />
        <AppText variant="subheading">{title}</AppText>
      </View>
      {children}
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <AppText variant="caption" tone="muted">
        {label}
      </AppText>
      <AppText>{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  row: { gap: 2 },
});
