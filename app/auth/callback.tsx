import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function CallbackScreen() {
  const router = useRouter();
  const { code, email } = useLocalSearchParams<{ code?: string; email?: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleCallback() {
      try {
        if (!code) {
          setError('No verification code found');
          setLoading(false);
          return;
        }

        // Try to verify OTP with the provided code
        // For magic link OTP, we use verifyOtp method
        const { data, error: err } = await supabase.auth.verifyOtp({
          token: code,
          type: 'email',
          email: email || '', // email might be in params or obtained from session
        });
        
        if (err) {
          // If verification fails with error, try exchangeCodeForSession for newer Supabase versions
          const { data: sessionData, error: sessionErr } = await supabase.auth.exchangeCodeForSession(code);
          
          if (sessionErr) {
            setError(sessionErr.message);
            setLoading(false);
            return;
          }

          if (sessionData.session) {
            router.replace('/(app)');
          }
          return;
        }

        if (data.session) {
          // Session is automatically updated via onAuthStateChange in _layout
          router.replace('/(app)');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setLoading(false);
      }
    }

    handleCallback();
  }, [code, email, router]);

  if (error) {
    return (
      <View className="flex-1 bg-white px-6 justify-center">
        <Text className="text-xl font-bold text-red-600 mb-4">Error</Text>
        <Text className="text-base text-gray-600">{error}</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white justify-center items-center">
      <ActivityIndicator size="large" color="#111827" />
      <Text className="text-gray-600 mt-4">Verifying your email...</Text>
    </View>
  );
}
