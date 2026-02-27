import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface EmptyCardProps {
  icon: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  onCtaPress: () => void;
}

export default function EmptyCard({
  icon,
  title,
  subtitle,
  ctaLabel,
  onCtaPress,
}: EmptyCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <TouchableOpacity onPress={onCtaPress} style={styles.ctaButton} activeOpacity={0.7}>
        <Text style={styles.ctaText}>{ctaLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  icon: {
    fontSize: 36,
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 18,
  },
  ctaButton: {
    borderWidth: 1.5,
    borderColor: '#D1D1D6',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  ctaText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
});
