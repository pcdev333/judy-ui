import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StreakCardProps {
  currentStreak: number;
  longestStreak: number;
  lastWorkoutDate: string | null;
  weekCompletions: string[]; // array of ISO date strings that had completed workouts this week
}

// Mon, Tue, Wed, Thu, Fri, Sat, Sun — abbreviated to single chars per design spec
const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function getWeekDates(): string[] {
  const today = new Date();
  // Monday = 0 offset
  const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon, ...6=Sat
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().split('T')[0];
  });
}

export default function StreakCard({
  currentStreak,
  longestStreak,
  lastWorkoutDate,
  weekCompletions,
}: StreakCardProps) {
  const weekDates = getWeekDates();
  const today = new Date().toISOString().split('T')[0];

  return (
    <View style={styles.card}>
      {/* Top row: flame + streak number + label */}
      <View style={styles.topRow}>
        <Text style={styles.flameEmoji}>🔥</Text>
        <View style={styles.streakInfo}>
          {currentStreak === 0 ? (
            <Text style={styles.startStreakText}>Start your streak today 💪</Text>
          ) : (
            <>
              <Text style={styles.streakNumber}>{currentStreak}</Text>
              <Text style={styles.streakDaysLabel}>days</Text>
            </>
          )}
        </View>
        <Text style={styles.yourStreak}>Your Streak</Text>
      </View>

      {/* Week dots */}
      <View style={styles.dotsRow}>
        {weekDates.map((date, i) => {
          const isCompleted = weekCompletions.includes(date);
          const isToday = date === today;
          const dotColor = isCompleted
            ? '#34C759'
            : isToday
              ? '#E8470A'
              : '#E5E5EA';
          return (
            <View key={date} style={styles.dotColumn}>
              <View style={[styles.dot, { backgroundColor: dotColor }]} />
              <Text style={styles.dayLabel}>{DAY_LABELS[i]}</Text>
            </View>
          );
        })}
      </View>

      {/* Personal best */}
      <Text style={styles.personalBest}>Personal best: {longestStreak} days</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  flameEmoji: {
    fontSize: 32,
    marginRight: 8,
  },
  streakInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    flex: 1,
  },
  streakNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  streakDaysLabel: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  startStreakText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
  },
  yourStreak: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'right',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dotColumn: {
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  dayLabel: {
    fontSize: 11,
    color: '#C7C7CC',
    fontWeight: '500',
  },
  personalBest: {
    fontSize: 12,
    color: '#C7C7CC',
    fontWeight: '500',
  },
});
