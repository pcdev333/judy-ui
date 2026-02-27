import React, { useState } from 'react';
import { View, Text, TextInput, Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import Button from '@/components/ui/Button';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSendMagicLink() {
    if (!email.trim()) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim() });
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
    </View>
  );
}
