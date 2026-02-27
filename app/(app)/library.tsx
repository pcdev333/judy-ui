import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { fetchWorkouts, deleteWorkout } from '@/lib/api';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { Workout } from '@/types';
import WorkoutHeroCard from '@/components/WorkoutHeroCard';
import FAB from '@/components/ui/FAB';

function getExerciseCount(workout: Workout): number {
  const json = workout.structured_json as { exercises?: unknown[] };
  return json?.exercises?.length ?? 0;
}

function getMuscleGroups(workout: Workout): string {
  const json = workout.structured_json as { muscle_groups?: string[] };
  return json?.muscle_groups?.join(' · ') ?? '';
}

function getCategory(workout: Workout): string | undefined {
  const json = workout.structured_json as { category?: string };
  return json?.category;
}

export default function LibraryScreen() {
  const router = useRouter();
  const { workouts, setWorkouts } = useWorkoutStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWorkouts();
  }, []);

  async function loadWorkouts() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWorkouts();
      setWorkouts(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load workouts.');
    } finally {
      setLoading(false);
    }
  }

  function confirmDelete(workout: Workout) {
    Alert.alert(
      'Delete Workout',
      `Are you sure you want to delete "${workout.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteWorkout(workout.id);
              setWorkouts(workouts.filter((w) => w.id !== workout.id));
            } catch (e: unknown) {
              Alert.alert('Error', e instanceof Error ? e.message : 'Failed to delete.');
            }
          },
        },
      ],
    );
  }

  function renderItem({ item }: { item: Workout }) {
    const exerciseCount = getExerciseCount(item);
    const muscleGroups = getMuscleGroups(item);
    const category = getCategory(item);
    return (
      <View style={styles.cardWrapper}>
        <WorkoutHeroCard
          title={item.title}
          subtitle={muscleGroups || (exerciseCount > 0 ? `${exerciseCount} exercises` : undefined)}
          category={category}
        />
        <TouchableOpacity
          onPress={() => confirmDelete(item)}
          style={styles.deleteButton}
          accessibilityLabel="Delete workout"
        >
          <Text style={styles.deleteIcon}>🗑</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>🏋️</Text>
      <Text style={styles.emptyTitle}>No workouts yet</Text>
      <Text style={styles.emptySubtitle}>Create your first workout to get started.</Text>
      <TouchableOpacity onPress={() => router.push('/(app)/create')} style={styles.emptyButton}>
        <Text style={styles.emptyButtonText}>Create your first workout</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Workouts</Text>
        <Text style={styles.headerSubtitle}>
          {workouts.length} {workouts.length === 1 ? 'workout' : 'workouts'}
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E8470A" />
        </View>
      ) : error ? (
        <View style={styles.emptyState}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={loadWorkouts} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={workouts}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={[
            styles.listContent,
            workouts.length === 0 && styles.listContentEmpty,
          ]}
          showsVerticalScrollIndicator={false}
        />
      )}

      <FAB onPress={() => router.push('/(app)/create')} icon="+" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#F2F2F7',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    gap: 16,
  },
  listContentEmpty: {
    flex: 1,
    justifyContent: 'center',
  },
  cardWrapper: {
    position: 'relative',
  },
  deleteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  deleteIcon: {
    fontSize: 16,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    height: 52,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#E8470A',
    borderRadius: 10,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

