import React, { useState, useContext } from 'react';
import { View, Text, TextInput, Alert, TouchableOpacity } from 'react-native';
import { supabase } from '@/lib/supabase';
import Button from '@/components/ui/Button';
import { DEV_BYPASS_AUTH } from '@/lib/devFlags';
import { DevBypassContext } from '@/app/_layout';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { setDevBypass } = useContext(DevBypassContext);

  async function handleSendMagicLink() {
    if (!email.trim()) return;
    setLoading(true);
    
    // Send magic link with proper redirect URL
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        // In Expo Go (dev), custom schemes like judy:// don't work — use the exp:// URL instead.
        // In production builds, judy:// deep link is used.
        emailRedirectTo: __DEV__
          ? process.env.EXPO_PUBLIC_AUTH_REDIRECT_URL ?? 'exp://localhost:8081/--/auth/callback'
          : 'judy://auth/callback',
      },
    });
    
    setLoading(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setSent(true);
    }
  }

  return (
    <View className="flex-1 bg-white px-6 justify-center">
      <Text className="text-3xl font-bold text-gray-900 mb-2">Welcome to Judy</Text>
      <Text className="text-base text-gray-500 mb-10">Sign in with your email to get started.</Text>

      {sent ? (
        <View className="bg-green-50 rounded-xl p-4 border border-green-200">
          <Text className="text-green-700 text-base text-center">
            Check your email for the magic link ✉️
          </Text>
        </View>
      ) : (
        <>
          <TextInput
            className="border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-900 mb-4"
            placeholder="you@example.com"
            placeholderTextColor="#9ca3af"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
          />
          <Button
            label={loading ? 'Sending…' : 'Send Magic Link'}
            onPress={handleSendMagicLink}
            disabled={loading || !email.trim()}
          />
        </>
      )}

      {DEV_BYPASS_AUTH && (
        <View style={{ marginTop: 32, alignItems: 'center' }}>
          {/* DEV ONLY — remove or disable EXPO_PUBLIC_DEV_BYPASS_AUTH before release */}
          <View style={{
            borderWidth: 1,
            borderColor: '#E8470A',
            borderStyle: 'dashed',
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 12,
            alignItems: 'center',
            width: '100%',
          }}>
            <Text style={{ fontSize: 10, color: '#E8470A', fontWeight: '700', marginBottom: 8, letterSpacing: 1 }}>
              🛠 DEV MODE
            </Text>
            <TouchableOpacity
              onPress={() => setDevBypass(true)}
              style={{
                backgroundColor: '#1A1A1A',
                borderRadius: 12,
                paddingVertical: 14,
                paddingHorizontal: 24,
                width: '100%',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>
                Continue as Guest (Dev Only)
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}
