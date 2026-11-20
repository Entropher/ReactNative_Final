import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, router, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { AuthProvider, useAuth } from '@/providers/auth-provider';
import { SurveyProvider, useSurvey } from '@/providers/survey-provider';

// Keep the splash screen up until we know whether someone is signed in.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30_000 } } }),
  );
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {/* Up here so a guest's answers survive signing in. */}
        <SurveyProvider>
          <RootNavigator />
        </SurveyProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

function RootNavigator() {
  const { session, isLoading, isPasswordReset } = useAuth();
  const { resumeAfterSignIn, setResumeAfterSignIn } = useSurvey();
  const scheme = useColorScheme();
  const theme = useTheme();

  // The navigator always renders; the splash screen covers the moment it
  // takes to restore a saved sign-in.
  useEffect(() => {
    if (!isLoading) SplashScreen.hideAsync();
  }, [isLoading]);

  // A guest who was asked to sign in before searching: once they're in, put
  // Home underneath and reopen the survey's last step with their answers.
  useEffect(() => {
    if (!session || isPasswordReset || !resumeAfterSignIn) return;
    setResumeAfterSignIn(false);
    if (router.canDismiss()) router.dismissAll();
    router.replace('/');
    router.push({ pathname: '/questionnaire', params: { step: 'last' } });
  }, [session, isPasswordReset, resumeAfterSignIn, setResumeAfterSignIn]);

  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: theme.primary,
      background: theme.background,
      card: theme.background,
      text: theme.text,
      border: theme.border,
    },
  };

  // Same header look as the screens inside (app) and (auth).
  const withHeader = {
    headerShown: true,
    headerTintColor: theme.primary,
    headerTitleStyle: { color: theme.text },
    headerShadowVisible: false,
    headerBackButtonDisplayMode: 'minimal',
  } as const;

  return (
    <ThemeProvider value={navigationTheme}>
      {/* Signed-in people see (app); everyone else sees (auth). */}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={!!session} redirectTo="/welcome">
          <Stack.Screen name="(app)" />
        </Stack.Protected>
        <Stack.Protected guard={!session}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        {/* Open to everyone: guests can try the survey and read the legal pages. */}
        <Stack.Screen name="questionnaire" options={{ ...withHeader, title: 'Find a Gift' }} />
        <Stack.Screen name="more-details" options={{ ...withHeader, title: 'More Details' }} />
        <Stack.Screen name="terms" options={{ ...withHeader, title: 'Terms of Service' }} />
        <Stack.Screen name="privacy" options={{ ...withHeader, title: 'Privacy Policy' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
