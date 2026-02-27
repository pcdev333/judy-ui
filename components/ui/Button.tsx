import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export default function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
}: ButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      className={[
        'rounded-xl py-4 px-6 items-center justify-center',
        variant === 'primary'
          ? 'bg-gray-900'
          : 'border-2 border-gray-900 bg-transparent',
        disabled ? 'opacity-50' : 'opacity-100',
      ].join(' ')}
    >
      <Text
        className={[
          'text-base font-semibold',
          variant === 'primary' ? 'text-white' : 'text-gray-900',
        ].join(' ')}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
