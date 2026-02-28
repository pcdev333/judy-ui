import { create } from 'zustand';
import { PlannedWorkout, Workout, ParsedWorkout } from '@/types';

interface WorkoutState {
  todayWorkout: PlannedWorkout | null;
  isLoading: boolean;
  workouts: Workout[];
  parsedWorkout: ParsedWorkout | null;
  plannedWorkouts: PlannedWorkout[];
  selectedPlannerDate: string;
  setTodayWorkout: (workout: PlannedWorkout | null) => void;
  setLoading: (loading: boolean) => void;
  setWorkouts: (workouts: Workout[]) => void;
  setParsedWorkout: (workout: ParsedWorkout | null) => void;
  setPlannedWorkouts: (workouts: PlannedWorkout[]) => void;
  setSelectedPlannerDate: (date: string) => void;
  updatePlannedWorkout: (date: string, updates: Partial<PlannedWorkout>) => void;
  removePlannedWorkout: (date: string) => void;
}

export const useWorkoutStore = create<WorkoutState>((set) => ({
  todayWorkout: null,
  isLoading: false,
  workouts: [],
  parsedWorkout: null,
  plannedWorkouts: [],
  selectedPlannerDate: new Date().toISOString().split('T')[0],
  setTodayWorkout: (workout) => set({ todayWorkout: workout }),
  setLoading: (loading) => set({ isLoading: loading }),
  setWorkouts: (workouts) => set({ workouts }),
  setParsedWorkout: (workout) => set({ parsedWorkout: workout }),
  setPlannedWorkouts: (workouts) => set({ plannedWorkouts: workouts }),
  setSelectedPlannerDate: (date) => set({ selectedPlannerDate: date }),
  updatePlannedWorkout: (date, updates) =>
    set((state) => ({
      plannedWorkouts: state.plannedWorkouts.map((pw) =>
        pw.planned_date === date ? { ...pw, ...updates } : pw,
      ),
    })),
  removePlannedWorkout: (date) =>
    set((state) => ({
      plannedWorkouts: state.plannedWorkouts.filter((pw) => pw.planned_date !== date),
    })),
}));
