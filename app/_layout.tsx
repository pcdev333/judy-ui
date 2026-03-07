import '../global.css';
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';

// DEV ONLY — provides setDevBypass to the auth screen so it can bypass auth during development.
export const DevBypassContext = React.createContext<{
  setDevBypass: (v: boolean) => void;
}>({ setDevBypass: () => {} });

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [devBypass, setDevBypass] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setInitialized(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      },
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!initialized) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (devBypass || session) {
      if (inAuthGroup) router.replace('/(app)');
    } else {
      if (!inAuthGroup) router.replace('/(auth)');
    }
  }, [session, devBypass, initialized, segments]);

  if (!initialized) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#111827" />
      </View>
    );
  }

  return (
    <DevBypassContext.Provider value={{ setDevBypass }}>
      <Slot />
    </DevBypassContext.Provider>
  );
}
