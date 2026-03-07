import { create } from 'zustand';
import { PlannedWorkout, Workout, ParsedWorkout, WorkoutLog } from '@/types';

interface WorkoutState {
  todayWorkout: PlannedWorkout | null;
  isLoading: boolean;
  workouts: Workout[];
  parsedWorkout: ParsedWorkout | null;
  plannedWorkouts: PlannedWorkout[];
  selectedPlannerDate: string;
  activePlannedWorkout: PlannedWorkout | null;
  activeWorkoutLogs: WorkoutLog[];
  setTodayWorkout: (workout: PlannedWorkout | null) => void;
  setLoading: (loading: boolean) => void;
  setWorkouts: (workouts: Workout[]) => void;
  setParsedWorkout: (workout: ParsedWorkout | null) => void;
  setPlannedWorkouts: (workouts: PlannedWorkout[]) => void;
  setSelectedPlannerDate: (date: string) => void;
  updatePlannedWorkout: (date: string, updates: Partial<PlannedWorkout>) => void;
  removePlannedWorkout: (date: string) => void;
  setActivePlannedWorkout: (workout: PlannedWorkout | null) => void;
  setActiveWorkoutLogs: (logs: WorkoutLog[]) => void;
  upsertActiveWorkoutLog: (log: WorkoutLog) => void;
}

export const useWorkoutStore = create<WorkoutState>((set) => ({
  todayWorkout: null,
  isLoading: false,
  workouts: [],
  parsedWorkout: null,
  plannedWorkouts: [],
  selectedPlannerDate: new Date().toISOString().split('T')[0],
  activePlannedWorkout: null,
  activeWorkoutLogs: [],
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
  setActivePlannedWorkout: (workout) => set({ activePlannedWorkout: workout }),
  setActiveWorkoutLogs: (logs) => set({ activeWorkoutLogs: logs }),
  upsertActiveWorkoutLog: (log) =>
    set((state) => {
      const idx = state.activeWorkoutLogs.findIndex(
        (l) =>
          l.planned_workout_id === log.planned_workout_id &&
          l.exercise_name === log.exercise_name &&
          l.set_number === log.set_number,
      );
      if (idx === -1) {
        return { activeWorkoutLogs: [...state.activeWorkoutLogs, log] };
      }
      const updated = [...state.activeWorkoutLogs];
      updated[idx] = log;
      return { activeWorkoutLogs: updated };
    }),
}));
