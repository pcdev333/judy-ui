import { supabase } from './supabase';
import { Workout, ParsedWorkout, PlannedWorkout, WorkoutLog } from '@/types';

function getTomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

export async function parseWorkout(rawText: string): Promise<ParsedWorkout> {
  const { data, error } = await supabase.functions.invoke('parseWorkout', {
    body: { raw_text: rawText },
  });
  if (error) throw error;
  return data as ParsedWorkout;
}

export async function fetchWorkouts(): Promise<Workout[]> {
  const { data, error } = await supabase
    .from('workouts')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Workout[];
}

export async function saveWorkout(
  title: string,
  rawInput: string,
  structuredJson: object,
): Promise<Workout> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('workouts')
    .insert({
      user_id: session.user.id,
      title,
      raw_input: rawInput,
      structured_json: structuredJson,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Workout;
}

export async function deleteWorkout(id: string): Promise<void> {
  const { error } = await supabase.from('workouts').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchTodayWorkout(): Promise<PlannedWorkout | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return null;

  const today = new Date().toISOString().split('T')[0];
  const { data } = await supabase
    .from('planned_workouts')
    .select('*, workout:workouts(*)')
    .eq('user_id', session.user.id)
    .eq('planned_date', today)
    .single();

  return (data as PlannedWorkout) ?? null;
}

export async function fetchPlannedWorkoutsForWeek(
  weekStart: string,
  weekEnd: string,
): Promise<PlannedWorkout[]> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return [];

  const { data, error } = await supabase
    .from('planned_workouts')
    .select('*, workout:workouts(*)')
    .eq('user_id', session.user.id)
    .gte('planned_date', weekStart)
    .lte('planned_date', weekEnd);
  if (error) throw error;
  return (data ?? []) as PlannedWorkout[];
}

export async function assignWorkoutToDate(
  workoutId: string,
  date: string,
): Promise<PlannedWorkout> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('planned_workouts')
    .upsert({
      user_id: session.user.id,
      workout_id: workoutId,
      planned_date: date,
      is_locked: false,
      is_completed: false,
    })
    .select('*, workout:workouts(*)')
    .single();
  if (error) throw error;
  return data as PlannedWorkout;
}

export async function removeWorkoutFromDate(date: string): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('planned_workouts')
    .delete()
    .eq('user_id', session.user.id)
    .eq('planned_date', date);
  if (error) throw error;
}

export async function setDayLocked(date: string, isLocked: boolean): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('planned_workouts')
    .update({ is_locked: isLocked })
    .eq('user_id', session.user.id)
    .eq('planned_date', date);
  if (error) throw error;
}

export async function lockTomorrow(isLocked: boolean): Promise<void> {
  return setDayLocked(getTomorrow(), isLocked);
}

export async function fetchPlannedWorkoutByDate(date: string): Promise<PlannedWorkout | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return null;

  const { data } = await supabase
    .from('planned_workouts')
    .select('*, workout:workouts(*)')
    .eq('user_id', session.user.id)
    .eq('planned_date', date)
    .single();

  return (data as PlannedWorkout) ?? null;
}

export async function fetchWorkoutLogs(plannedWorkoutId: string): Promise<WorkoutLog[]> {
  const { data, error } = await supabase
    .from('workout_logs')
    .select('*')
    .eq('planned_workout_id', plannedWorkoutId)
    .order('set_number', { ascending: true });
  if (error) throw error;
  return (data ?? []) as WorkoutLog[];
}

export async function upsertWorkoutLog(
  plannedWorkoutId: string,
  exerciseName: string,
  setNumber: number,
  repsCompleted: number | null,
  weight: number | null,
): Promise<WorkoutLog> {
  const { data, error } = await supabase
    .from('workout_logs')
    .upsert(
      {
        planned_workout_id: plannedWorkoutId,
        exercise_name: exerciseName,
        set_number: setNumber,
        reps_completed: repsCompleted,
        weight,
      },
      { onConflict: 'planned_workout_id,exercise_name,set_number' },
    )
    .select()
    .single();
  if (error) throw error;
  return data as WorkoutLog;
}

export async function finishPlannedWorkout(plannedWorkoutId: string): Promise<void> {
  const { error } = await supabase
    .from('planned_workouts')
    .update({ is_completed: true, completed_at: new Date().toISOString() })
    .eq('id', plannedWorkoutId);
  if (error) throw error;
}
