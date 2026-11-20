import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { Appearance } from 'react-native';

import { usePreferences } from '@/hooks/use-gift-data';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/providers/auth-provider';

export default function AppLayout() {
  const theme = useTheme();
  const { isPasswordReset } = useAuth();
  const { data: preferences } = usePreferences();

  // Apply the Light / Dark / System choice from Settings to the whole app.
  const themeChoice = preferences?.theme;
  useEffect(() => {
    Appearance.setColorScheme(themeChoice === 'light' || themeChoice === 'dark' ? themeChoice : 'unspecified');
  }, [themeChoice]);
  // Back to the phone's setting after signing out.
  useEffect(() => () => Appearance.setColorScheme('unspecified'), []);

  return (
    <Stack
      screenOptions={{
        headerTintColor: theme.primary,
        headerTitleStyle: { color: theme.text },
        headerShadowVisible: false,
        headerBackButtonDisplayMode: 'minimal',
      }}>
      {/* After a "reset password" link, only the new-password screen is available. */}
      <Stack.Protected guard={!isPasswordReset}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false, title: 'Home' }} />
        <Stack.Screen name="results/[id]" options={{ title: 'Gift Ideas' }} />
      </Stack.Protected>
      <Stack.Protected guard={isPasswordReset}>
        <Stack.Screen
          name="set-new-password"
          options={{ title: 'New Password', headerBackVisible: false, gestureEnabled: false }}
        />
      </Stack.Protected>
    </Stack>
  );
}
