import type { Session } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import { createContext, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';

import { parseAuthLink } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

type AuthState = {
  session: Session | null;
  isLoading: boolean;
  /** True after opening a "reset password" link, until a new password is saved. */
  isPasswordReset: boolean;
  finishPasswordReset: () => void;
};

const AuthContext = createContext<AuthState>({
  session: null,
  isLoading: true,
  isPasswordReset: false,
  finishPasswordReset: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

// Each email link can only be used once, so never handle the same one twice.
const handledLinks = new Set<string>();

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPasswordReset, setIsPasswordReset] = useState(false);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => setSession(data.session))
      // If the saved sign-in can't be read, start signed out instead of
      // leaving the splash screen up forever.
      .catch((error) => console.error('Could not restore sign-in:', error))
      .finally(() => setIsLoading(false));

    const { data } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      setIsLoading(false);
      if (event === 'SIGNED_OUT') {
        setIsPasswordReset(false);
        // Don't show one person's cached data to the next person who signs in.
        queryClient.clear();
      }
    });
    return () => data.subscription.unsubscribe();
  }, [queryClient]);

  // Email links (confirm email, reset password) open the app with a session.
  useEffect(() => {
    const openLink = async (url: string | null) => {
      if (!url || handledLinks.has(url)) return;
      handledLinks.add(url);

      const link = parseAuthLink(url);
      if (!link) return;
      if (link.kind === 'error') {
        Alert.alert("This link didn't work", link.message);
        return;
      }
      // Set before signing in, so the app opens "Choose a new password" directly.
      if (link.isPasswordReset) setIsPasswordReset(true);

      const { error } = await supabase.auth.setSession({
        access_token: link.accessToken,
        refresh_token: link.refreshToken,
      });
      if (error) {
        setIsPasswordReset(false);
        Alert.alert("This link didn't work", error.message);
      }
    };

    Linking.getInitialURL().then(openLink);
    const subscription = Linking.addEventListener('url', ({ url }) => openLink(url));
    return () => subscription.remove();
  }, []);

  const value: AuthState = {
    session,
    isLoading,
    isPasswordReset,
    finishPasswordReset: () => setIsPasswordReset(false),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
