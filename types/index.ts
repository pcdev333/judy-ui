export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Workout {
  id: string;
  user_id: string;
  title: string;
  raw_input: string;
  structured_json: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface PlannedWorkout {
  id: string;
  user_id: string;
  workout_id: string;
  planned_date: string;
  is_locked: boolean;
  is_completed: boolean;
  completed_at: string | null;
  workout?: Workout;
}

export interface WorkoutLog {
  id: string;
  planned_workout_id: string;
  exercise_name: string;
  set_number: number;
  reps_completed: number;
  weight: number;
  created_at: string;
}
