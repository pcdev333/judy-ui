import { create } from 'zustand';
import { PlannedWorkout } from '@/types';

interface WorkoutState {
  todayWorkout: PlannedWorkout | null;
  isLoading: boolean;
  setTodayWorkout: (workout: PlannedWorkout | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useWorkoutStore = create<WorkoutState>((set) => ({
  todayWorkout: null,
  isLoading: false,
  setTodayWorkout: (workout) => set({ todayWorkout: workout }),
  setLoading: (loading) => set({ isLoading: loading }),
}));
