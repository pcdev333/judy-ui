import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import WeekDayStrip from '@/components/WeekDayStrip';
import WorkoutHeroCard from '@/components/WorkoutHeroCard';
import EmptyCard from '@/components/ui/EmptyCard';

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

function formatDisplayDate(isoDate: string): string {
  const d = new Date(isoDate + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function TodayScreen() {
  const router = useRouter();
  const { todayWorkout, isLoading, setTodayWorkout, setLoading } = useWorkoutStore();
  const [selectedDate, setSelectedDate] = useState(getTodayDate());

  useEffect(() => {
    async function fetchTodayWorkout() {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('planned_workouts')
        .select('*, workout:workouts(*)')
        .eq('user_id', session.user.id)
        .eq('planned_date', selectedDate)
        .single();

      setTodayWorkout(data ?? null);
      setLoading(false);
    }

    fetchTodayWorkout();
  }, [selectedDate]);

  const today = getTodayDate();
  const structured = todayWorkout?.workout?.structured_json as {
    exercises?: unknown[];
    muscle_groups?: string[];
    duration?: number;
    category?: string;
  } | undefined;
  const exerciseCount = structured?.exercises?.length ?? 0;
  const muscleGroups = structured?.muscle_groups?.join(' · ') ?? '';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.todayLabel}>TODAY</Text>
          <Text style={styles.dateText}>{formatDisplayDate(today)}</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/(app)/library')} style={styles.iconButton}>
          <Text style={styles.iconText}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Week Day Strip */}
      <WeekDayStrip
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
      />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <ActivityIndicator size="large" color="#E8470A" style={styles.loader} />
        ) : todayWorkout ? (
          <>
            <WorkoutHeroCard
              title={todayWorkout.workout?.title ?? "Today's Workout"}
              subtitle={muscleGroups || undefined}
              category={structured?.category}
              duration={structured?.duration}
            />
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>
                {exerciseCount > 0 ? `${exerciseCount} Exercises` : ''}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push(`/(app)/workout/${todayWorkout.workout_id}`)}
              style={styles.startButton}
            >
              <Text style={styles.startIcon}>▶</Text>
              <Text style={styles.startText}>Start Workout</Text>
            </TouchableOpacity>
          </>
        ) : (
          <EmptyCard
            icon="📅"
            title="No workout planned"
            subtitle="You haven't planned a workout for this day yet."
            ctaLabel="Plan a Workout"
            onCtaPress={() => router.push('/(app)/planner')}
          />
        )}

        {/* Tomorrow empty card */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>TOMORROW</Text>
        </View>
        <EmptyCard
          icon="🌅"
          title="Tomorrow is empty"
          subtitle="Plan ahead and stay consistent with your training."
          ctaLabel="Plan Tomorrow's Workout"
          onCtaPress={() => router.push('/(app)/planner')}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 60,
    paddingBottom: 8,
    paddingHorizontal: 20,
  },
  todayLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 2,
  },
  iconButton: {
    padding: 8,
  },
  iconText: {
    fontSize: 22,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 16,
  },
  loader: {
    marginTop: 40,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  metaText: {
    fontSize: 13,
    color: '#8E8E93',
  },
  startButton: {
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  startIcon: {
    color: '#E8470A',
    fontSize: 16,
    marginRight: 4,
  },
  startText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  sectionHeader: {
    marginTop: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

