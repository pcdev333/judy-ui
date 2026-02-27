import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface FABProps {
  onPress: () => void;
  icon?: string;
}

export default function FAB({ onPress, icon = '🎤' }: FABProps) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.fab} activeOpacity={0.8}>
      <Text style={styles.icon}>{icon}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E8470A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  icon: {
    fontSize: 22,
  },
});
