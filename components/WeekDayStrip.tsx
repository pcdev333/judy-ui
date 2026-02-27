import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';

interface WeekDayStripProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  plannedDates?: string[];
  completedDates?: string[];
  lockedDates?: string[];
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getWeekDates(referenceDate: string): Date[] {
  const ref = new Date(referenceDate + 'T00:00:00');
  const dayOfWeek = ref.getDay(); // 0 = Sunday
  const monday = new Date(ref);
  monday.setDate(ref.getDate() - ((dayOfWeek + 6) % 7)); // Monday of this week
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function toIso(date: Date): string {
  return date.toISOString().split('T')[0];
}

export default function WeekDayStrip({
  selectedDate,
  onSelectDate,
  plannedDates = [],
  completedDates = [],
  lockedDates = [],
}: WeekDayStripProps) {
  const weekDates = getWeekDates(selectedDate);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {weekDates.map((date) => {
        const iso = toIso(date);
        const isSelected = iso === selectedDate;
        const isCompleted = completedDates.includes(iso);
        const isPlanned = plannedDates.includes(iso);
        const isLocked = lockedDates.includes(iso);

        return (
          <TouchableOpacity
            key={iso}
            onPress={() => onSelectDate(iso)}
            style={styles.dayWrapper}
            activeOpacity={0.7}
          >
            <Text style={[styles.dayName, !isSelected && styles.inactiveText]}>
              {DAY_NAMES[date.getDay()]}
            </Text>
            <View style={[styles.dateCircle, isSelected && styles.activeDateCircle]}>
              <Text style={[styles.dateNumber, isSelected && styles.activeDateText, !isSelected && styles.inactiveText]}>
                {date.getDate()}
              </Text>
            </View>
            <View style={styles.dotRow}>
              {isLocked ? (
                <Text style={styles.lockIcon}>🔒</Text>
              ) : isCompleted ? (
                <View style={[styles.dot, styles.completedDot]} />
              ) : isPlanned ? (
                <View style={[styles.dot, styles.plannedDot]} />
              ) : (
                <View style={styles.dotPlaceholder} />
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 4,
  },
  dayWrapper: {
    alignItems: 'center',
    width: 44,
    marginHorizontal: 2,
  },
  dayName: {
    fontSize: 11,
    fontWeight: '500',
    color: '#8E8E93',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  inactiveText: {
    color: '#C7C7CC',
  },
  dateCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeDateCircle: {
    backgroundColor: '#E8470A',
  },
  dateNumber: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  activeDateText: {
    color: '#FFFFFF',
  },
  dotRow: {
    marginTop: 3,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockIcon: {
    fontSize: 10,
    lineHeight: 14,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  completedDot: {
    backgroundColor: '#34C759',
  },
  plannedDot: {
    backgroundColor: '#E8470A',
  },
  dotPlaceholder: {
    width: 5,
    height: 5,
  },
});
