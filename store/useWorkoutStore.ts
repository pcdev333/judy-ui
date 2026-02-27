import { create } from 'zustand';
import { PlannedWorkout, Workout, ParsedWorkout } from '@/types';

interface WorkoutState {
  todayWorkout: PlannedWorkout | null;
  isLoading: boolean;
  workouts: Workout[];
  parsedWorkout: ParsedWorkout | null;
  setTodayWorkout: (workout: PlannedWorkout | null) => void;
  setLoading: (loading: boolean) => void;
  setWorkouts: (workouts: Workout[]) => void;
  setParsedWorkout: (workout: ParsedWorkout | null) => void;
}

export const useWorkoutStore = create<WorkoutState>((set) => ({
  todayWorkout: null,
  isLoading: false,
  workouts: [],
  parsedWorkout: null,
  setTodayWorkout: (workout) => set({ todayWorkout: workout }),
  setLoading: (loading) => set({ isLoading: loading }),
  setWorkouts: (workouts) => set({ workouts }),
  setParsedWorkout: (workout) => set({ parsedWorkout: workout }),
}));
