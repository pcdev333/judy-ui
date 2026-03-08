import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase';

/**
 * Handles the Supabase magic link callback.
 *
 * Supabase magic links redirect to this screen with the session tokens
 * in the URL hash fragment, e.g.:
 *   exp://IP:8081/--/auth/callback#access_token=xxx&refresh_token=xxx&type=signup
 *
 * React Native's router does NOT expose hash fragments via useLocalSearchParams,
 * so we use expo-linking to get the full URL and parse the hash manually.
 */
export default function CallbackScreen() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let handled = false;

    async function handleDeepLink(url: string) {
      if (handled) return;
      handled = true;

      try {
        // The tokens are in the hash fragment after '#'
        const hashIndex = url.indexOf('#');
        if (hashIndex === -1) {
          setError('Invalid magic link — no token fragment found.');
          return;
        }

        const fragment = url.substring(hashIndex + 1);
        const params = new URLSearchParams(fragment);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (!accessToken || !refreshToken) {
          setError('Invalid magic link — missing tokens.');
          return;
        }

        // Set the session using the tokens from the URL fragment
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (sessionError) {
          setError(sessionError.message);
          return;
        }

        // Session is now set — _layout.tsx onAuthStateChange will fire
        // and redirect to /(app) automatically. We also push explicitly.
        router.replace('/(app)');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
      }
    }

    // Get the URL that launched this screen
    Linking.getInitialURL()
      .then((url) => {
        if (url) {
          handleDeepLink(url);
        } else {
          setError('No redirect URL received.');
        }
      })
      .catch(() => {
        setError('Failed to retrieve redirect URL.');
      });

    // Also listen for URL events in case the app was already open
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    return () => subscription.remove();
  }, [router]);

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F2F2F7', paddingHorizontal: 24, justifyContent: 'center' }}>
        <Text style={{ fontSize: 20, fontWeight: '700', color: '#E8470A', marginBottom: 12 }}>
          Sign-in Failed
        </Text>
        <Text style={{ fontSize: 15, color: '#1A1A1A', marginBottom: 24 }}>{error}</Text>
        <Text
          style={{ fontSize: 15, color: '#E8470A', fontWeight: '600' }}
          onPress={() => router.replace('/(auth)')}
        >
          ← Try again
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F2F2F7', justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#E8470A" />
      <Text style={{ color: '#8E8E93', marginTop: 16, fontSize: 15 }}>Signing you in…</Text>
    </View>
  );
}
