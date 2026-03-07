import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Modal } from 'react-native';

interface MilestoneToastProps {
  visible: boolean;
  days: number;
  onDismiss: () => void;
}

function getMilestoneMessage(days: number): string {
  switch (days) {
    case 3:
      return '3 days in a row! You\'re building a habit 🔥';
    case 7:
      return 'One full week! You\'re on fire 🏆';
    case 14:
      return 'Two weeks strong. This is who you are now 💪';
    case 30:
      return '30 days. Absolute legend. 🥇';
    default:
      return `${days} days in a row! Keep it up 🔥`;
  }
}

export default function MilestoneToast({ visible, days, onDismiss }: MilestoneToastProps) {
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 80,
        friction: 8,
      }).start();
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      // Auto-dismiss after 4 seconds
      dismissTimerRef.current = setTimeout(() => {
        onDismiss();
      }, 4000);
    } else {
      scaleAnim.setValue(0.7);
      opacityAnim.setValue(0);
    }

    return () => {
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
      }
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onDismiss}>
      <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
        <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
          <Text style={styles.message}>{getMilestoneMessage(days)}</Text>
          <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
            <Text style={styles.dismissText}>Keep going →</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  message: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 24,
  },
  dismissButton: {
    backgroundColor: '#E8470A',
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  dismissText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
