import type { Session } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';

import { completeSignInFromLink } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

type AuthState = { session: Session | null; isLoading: boolean };

const AuthContext = createContext<AuthState>({ session: null, isLoading: true });

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<AuthState>({ session: null, isLoading: true });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setState({ session: data.session, isLoading: false });
    });

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      setState({ session, isLoading: false });
      // Don't show one person's cached data to the next person who signs in.
      if (event === 'SIGNED_OUT') queryClient.clear();
    });
    return () => data.subscription.unsubscribe();
  }, [queryClient]);

  // Handle the app being opened from an email confirmation link.
  const url = Linking.useLinkingURL();
  const handledUrls = useRef(new Set<string>());
  useEffect(() => {
    if (!url || handledUrls.current.has(url)) return;
    handledUrls.current.add(url);
    completeSignInFromLink(url).then(({ error }) => {
      if (error) Alert.alert("Couldn't confirm your email", error);
    });
  }, [url]);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}
