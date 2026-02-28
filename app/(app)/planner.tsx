import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  fetchPlannedWorkoutsForWeek,
  assignWorkoutToDate,
  removeWorkoutFromDate,
  setDayLocked,
  lockTomorrow,
} from '@/lib/api';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { Workout } from '@/types';
import WeekDayStrip from '@/components/WeekDayStrip';
import WorkoutHeroCard from '@/components/WorkoutHeroCard';
import EmptyCard from '@/components/ui/EmptyCard';
import WorkoutPickerSheet from '@/components/WorkoutPickerSheet';

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

function getTomorrowDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

function getWeekBounds(referenceDate: string): { weekStart: string; weekEnd: string } {
  const ref = new Date(referenceDate + 'T00:00:00');
  const dayOfWeek = ref.getDay();
  const monday = new Date(ref);
  monday.setDate(ref.getDate() - ((dayOfWeek + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    weekStart: monday.toISOString().split('T')[0],
    weekEnd: sunday.toISOString().split('T')[0],
  };
}

function formatDisplayDate(isoDate: string): string {
  const d = new Date(isoDate + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

export default function PlannerScreen() {
  const router = useRouter();
  const {
    plannedWorkouts,
    selectedPlannerDate,
    setPlannedWorkouts,
    setSelectedPlannerDate,
    updatePlannedWorkout,
    removePlannedWorkout,
  } = useWorkoutStore();

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [lockTomorrowEnabled, setLockTomorrowEnabled] = useState(false);

  const today = getTodayDate();
  const tomorrow = getTomorrowDate();

  const selectedWorkout = plannedWorkouts.find(
    (pw) => pw.planned_date === selectedPlannerDate,
  ) ?? null;

  const plannedDates = plannedWorkouts.map((pw) => pw.planned_date);
  const completedDates = plannedWorkouts
    .filter((pw) => pw.is_completed)
    .map((pw) => pw.planned_date);
  const lockedDates = plannedWorkouts
    .filter((pw) => pw.is_locked)
    .map((pw) => pw.planned_date);

  const loadWeek = useCallback(async () => {
    setLoading(true);
    try {
      const { weekStart, weekEnd } = getWeekBounds(selectedPlannerDate);
      const data = await fetchPlannedWorkoutsForWeek(weekStart, weekEnd);
      setPlannedWorkouts(data);
      // Sync lock tomorrow toggle
      const tomorrowPlan = data.find((pw) => pw.planned_date === tomorrow);
      setLockTomorrowEnabled(tomorrowPlan?.is_locked ?? false);
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to load planner.');
    } finally {
      setLoading(false);
    }
  }, [selectedPlannerDate, tomorrow, setPlannedWorkouts]);

  useEffect(() => {
    loadWeek();
  }, [loadWeek]);

  async function handleToggleLockTomorrow(value: boolean) {
    const tomorrowPlan = plannedWorkouts.find((pw) => pw.planned_date === tomorrow);
    if (value && !tomorrowPlan) {
      Alert.alert('No workout assigned', 'Assign a workout to tomorrow first before locking.');
      return;
    }
    setLockTomorrowEnabled(value);
    // Optimistic update
    updatePlannedWorkout(tomorrow, { is_locked: value });
    try {
      await lockTomorrow(value);
    } catch (e: unknown) {
      // Revert optimistic update
      setLockTomorrowEnabled(!value);
      updatePlannedWorkout(tomorrow, { is_locked: !value });
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to update lock.');
    }
  }

  async function handleAssignWorkout(workout: Workout) {
    setPickerVisible(false);
    setActionLoading(true);
    try {
      const newPlan = await assignWorkoutToDate(workout.id, selectedPlannerDate);
      // Replace or add in store
      const exists = plannedWorkouts.some((pw) => pw.planned_date === selectedPlannerDate);
      if (exists) {
        updatePlannedWorkout(selectedPlannerDate, newPlan);
      } else {
        setPlannedWorkouts([...plannedWorkouts, newPlan]);
      }
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to assign workout.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRemoveWorkout() {
    if (selectedWorkout?.is_locked) {
      Alert.alert('Locked', 'Unlock this day before removing the workout.');
      return;
    }
    Alert.alert('Remove Workout', 'Remove the workout from this day?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setActionLoading(true);
          try {
            await removeWorkoutFromDate(selectedPlannerDate);
            removePlannedWorkout(selectedPlannerDate);
          } catch (e: unknown) {
            Alert.alert('Error', e instanceof Error ? e.message : 'Failed to remove workout.');
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  }

  async function handleLockDay(isLocked: boolean) {
    if (!selectedWorkout && isLocked) {
      Alert.alert('No workout assigned', 'Assign a workout first before locking this day.');
      return;
    }
    // Optimistic update
    updatePlannedWorkout(selectedPlannerDate, { is_locked: isLocked });
    if (selectedPlannerDate === tomorrow) {
      setLockTomorrowEnabled(isLocked);
    }
    try {
      await setDayLocked(selectedPlannerDate, isLocked);
    } catch (e: unknown) {
      // Revert
      updatePlannedWorkout(selectedPlannerDate, { is_locked: !isLocked });
      if (selectedPlannerDate === tomorrow) {
        setLockTomorrowEnabled(!isLocked);
      }
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to update lock.');
    }
  }

  function handleSelectDate(date: string) {
    setSelectedPlannerDate(date);
  }

  function handleAssignPress() {
    if (selectedWorkout?.is_locked) {
      Alert.alert('Locked', 'Unlock this day to edit the workout.');
      return;
    }
    setPickerVisible(true);
  }

  const structured = selectedWorkout?.workout?.structured_json as {
    exercises?: unknown[];
    muscle_groups?: string[];
    duration?: number;
    category?: string;
  } | undefined;
  const muscleGroups = structured?.muscle_groups?.join(' · ') ?? '';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} accessibilityLabel="Go back">
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Planner</Text>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Lock Tomorrow</Text>
          <Switch
            value={lockTomorrowEnabled}
            onValueChange={handleToggleLockTomorrow}
            trackColor={{ false: '#C7C7CC', true: '#E8470A' }}
            thumbColor="#FFFFFF"
            ios_backgroundColor="#C7C7CC"
          />
        </View>
      </View>

      {/* Week Day Strip */}
      <WeekDayStrip
        selectedDate={selectedPlannerDate}
        onSelectDate={handleSelectDate}
        plannedDates={plannedDates}
        completedDates={completedDates}
        lockedDates={lockedDates}
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E8470A" />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Selected day label */}
          <Text style={styles.dayLabel}>{formatDisplayDate(selectedPlannerDate)}</Text>

          {actionLoading && (
            <ActivityIndicator size="small" color="#E8470A" style={styles.actionLoader} />
          )}

          {selectedWorkout ? (
            <>
              <WorkoutHeroCard
                title={selectedWorkout.workout?.title ?? 'Workout'}
                subtitle={muscleGroups || undefined}
                category={structured?.category}
                duration={structured?.duration}
              />

              {selectedWorkout.is_completed ? (
                <View style={styles.completedRow}>
                  <Text style={styles.completedIcon}>✅</Text>
                  <Text style={styles.completedText}>Completed</Text>
                </View>
              ) : selectedWorkout.is_locked ? (
                <View style={styles.lockedRow}>
                  <Text style={styles.lockIconLarge}>🔒</Text>
                  <Text style={styles.lockedText}>Locked</Text>
                  <TouchableOpacity
                    onPress={() => handleLockDay(false)}
                    style={styles.ctaSecondary}
                    disabled={actionLoading}
                  >
                    <Text style={styles.ctaSecondaryText}>Unlock</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  {(selectedPlannerDate <= today) && (
                    <TouchableOpacity
                      onPress={() => router.push(`/(app)/workout/${selectedPlannerDate}`)}
                      style={[styles.ctaStart, actionLoading && styles.disabled]}
                      disabled={actionLoading}
                    >
                      <Text style={styles.ctaStartIcon}>▶</Text>
                      <Text style={styles.ctaStartText}>Start Workout</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={() => handleLockDay(true)}
                    style={[styles.ctaPrimary, actionLoading && styles.disabled]}
                    disabled={actionLoading}
                  >
                    <Text style={styles.ctaPrimaryText}>🔒  Lock Day</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleRemoveWorkout}
                    style={[styles.ctaSecondary, actionLoading && styles.disabled]}
                    disabled={actionLoading}
                  >
                    <Text style={styles.ctaSecondaryText}>Remove</Text>
                  </TouchableOpacity>
                </>
              )}
            </>
          ) : (
            <EmptyCard
              icon="📅"
              title="No workout planned"
              subtitle="Assign a workout to this day"
              ctaLabel="+ Assign Workout"
              onCtaPress={handleAssignPress}
            />
          )}
        </ScrollView>
      )}

      <WorkoutPickerSheet
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onSelect={handleAssignWorkout}
      />
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingBottom: 12,
    paddingHorizontal: 20,
    backgroundColor: '#F2F2F7',
  },
  backButton: {
    width: 36,
  },
  backArrow: {
    fontSize: 22,
    color: '#1A1A1A',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toggleLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#8E8E93',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 60,
    gap: 14,
  },
  dayLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 4,
  },
  actionLoader: {
    alignSelf: 'center',
  },
  lockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  lockIconLarge: {
    fontSize: 20,
    color: '#E8470A',
  },
  lockedText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#E8470A',
  },
  ctaPrimary: {
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaPrimaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  ctaSecondary: {
    borderWidth: 1.5,
    borderColor: '#D1D1D6',
    borderStyle: 'dashed',
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  ctaSecondaryText: {
    color: '#1A1A1A',
    fontSize: 16,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.4,
  },
  completedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  completedIcon: {
    fontSize: 20,
  },
  completedText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#34C759',
  },
  ctaStart: {
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  ctaStartIcon: {
    color: '#E8470A',
    fontSize: 16,
  },
  ctaStartText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

