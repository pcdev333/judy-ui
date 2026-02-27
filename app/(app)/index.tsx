import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import Button from '@/components/ui/Button';

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning 👋';
  if (hour < 18) return 'Good afternoon 👋';
  return 'Good evening 👋';
}

export default function TodayScreen() {
  const router = useRouter();
  const { todayWorkout, isLoading, setTodayWorkout, setLoading } = useWorkoutStore();
  const today = getTodayDate();

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
        .eq('planned_date', today)
        .single();

      setTodayWorkout(data ?? null);
      setLoading(false);
    }

    fetchTodayWorkout();
  }, [today]);

  return (
    <View className="flex-1 bg-white px-6 pt-16">
      <Text className="text-sm text-gray-400 mb-1">{today}</Text>
      <Text className="text-3xl font-bold text-gray-900 mb-8">{getGreeting()}</Text>

      {isLoading ? (
        <Text className="text-gray-400 text-base">Loading…</Text>
      ) : todayWorkout ? (
        <View>
          <Text className="text-lg font-semibold text-gray-700 mb-6">
            {todayWorkout.workout?.title ?? "Today's Workout"}
          </Text>
          <Button
            label="START"
            onPress={() => router.push(`/(app)/workout/${todayWorkout.workout_id}`)}
          />
        </View>
      ) : (
        <View>
          <Text className="text-base text-gray-500 mb-6">No workout planned for today.</Text>
          <Button
            label="Plan Tomorrow"
            variant="secondary"
            onPress={() => router.push('/(app)/planner')}
          />
        </View>
      )}
    </View>
  );
}
