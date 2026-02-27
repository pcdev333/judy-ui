import { supabase } from './supabase';
import { Workout, ParsedWorkout, PlannedWorkout } from '@/types';

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
