import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  fetchPlannedWorkoutByDate,
  fetchWorkoutLogs,
  upsertWorkoutLog,
  finishPlannedWorkout,
} from '@/lib/api';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { ParsedExercise, PlannedWorkout, WorkoutLog } from '@/types';

function isValidDate(str: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(str);
}

type LogKey = string; // `${exerciseName}:::${setNumber}`
type LogEntry = {
  repsCompleted: string;
  weight: string;
  completed: boolean;
  saving: boolean;
  saveError: string | null;
};

function makeKey(exerciseName: string, setNumber: number): LogKey {
  return `${exerciseName}:::${setNumber}`;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const TIMER_PRESETS = [60, 90, 120] as const;

export default function WorkoutExecutionScreen() {
  const { id: plannedDate } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const {
    setActivePlannedWorkout,
    setActiveWorkoutLogs,
    upsertActiveWorkoutLog,
    updatePlannedWorkout,
  } = useWorkoutStore();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [plannedWorkout, setPlannedWorkout] = useState<PlannedWorkout | null>(null);
  const [exercises, setExercises] = useState<ParsedExercise[]>([]);
  const [logs, setLogs] = useState<Record<LogKey, LogEntry>>({});
  const [finishing, setFinishing] = useState(false);

  // Rest timer state
  const [timerVisible, setTimerVisible] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState<number>(60);
  const [timerSeconds, setTimerSeconds] = useState<number>(60);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load data
  useEffect(() => {
    if (!isValidDate(plannedDate ?? '')) {
      setLoadError('Invalid date. Please go back and try again.');
      setLoading(false);
      return;
    }

    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        const pw = await fetchPlannedWorkoutByDate(plannedDate as string);
        if (!pw) {
          setLoadError('No workout planned for this date.');
          setLoading(false);
          return;
        }
        setPlannedWorkout(pw);
        setActivePlannedWorkout(pw);

        const structured = pw.workout?.structured_json as {
          exercises?: ParsedExercise[];
        } | undefined;
        const exList: ParsedExercise[] = structured?.exercises ?? [];
        setExercises(exList);

        const existingLogs = await fetchWorkoutLogs(pw.id);
        setActiveWorkoutLogs(existingLogs);

        // Build initial log entries from existing logs + defaults from prescription
        const initialLogs: Record<LogKey, LogEntry> = {};
        exList.forEach((ex) => {
          for (let s = 1; s <= (ex.sets ?? 1); s++) {
            const key = makeKey(ex.name, s);
            const existing = existingLogs.find(
              (l) => l.exercise_name === ex.name && l.set_number === s,
            );
            initialLogs[key] = {
              repsCompleted: existing?.reps_completed != null
                ? String(existing.reps_completed)
                : ex.reps != null ? String(ex.reps) : '',
              weight: existing?.weight != null
                ? String(existing.weight)
                : ex.weight != null ? String(ex.weight) : '',
              completed: existing != null,
              saving: false,
              saveError: null,
            };
          }
        });
        setLogs(initialLogs);
      } catch (e: unknown) {
        setLoadError(e instanceof Error ? e.message : 'Failed to load workout.');
      } finally {
        setLoading(false);
      }
    }

    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plannedDate]);

  // Timer countdown
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            setTimerRunning(false);
            if (timerRef.current) clearInterval(timerRef.current);
            // Graceful fallback: alert when timer finishes
            Alert.alert('Rest Complete', "Time's up! Get back to work 💪");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerRunning]);

  const handlePickDuration = useCallback((secs: number) => {
    setSelectedDuration(secs);
    setTimerSeconds(secs);
    setTimerRunning(false);
  }, []);

  const handleTimerStartPause = useCallback(() => {
    setTimerRunning((prev) => !prev);
  }, []);

  const handleTimerReset = useCallback(() => {
    setTimerRunning(false);
    setTimerSeconds(selectedDuration);
  }, [selectedDuration]);

  const saveLog = useCallback(
    async (exerciseName: string, setNumber: number) => {
      if (!plannedWorkout) return;
      const key = makeKey(exerciseName, setNumber);
      const entry = logs[key];
      if (!entry) return;

      const reps = entry.repsCompleted !== '' ? parseInt(entry.repsCompleted, 10) : null;
      const w = entry.weight !== '' ? parseFloat(entry.weight) : null;

      setLogs((prev) => ({
        ...prev,
        [key]: { ...prev[key], saving: true, saveError: null },
      }));

      try {
        const saved = await upsertWorkoutLog(
          plannedWorkout.id,
          exerciseName,
          setNumber,
          reps,
          w,
        );
        upsertActiveWorkoutLog(saved);
        setLogs((prev) => ({
          ...prev,
          [key]: { ...prev[key], saving: false },
        }));
      } catch (e: unknown) {
        setLogs((prev) => ({
          ...prev,
          [key]: {
            ...prev[key],
            saving: false,
            saveError: e instanceof Error ? e.message : 'Save failed',
          },
        }));
      }
    },
    [plannedWorkout, logs, upsertActiveWorkoutLog],
  );

  const handleToggleSet = useCallback(
    async (exerciseName: string, setNumber: number) => {
      const key = makeKey(exerciseName, setNumber);
      const newCompleted = !logs[key]?.completed;
      setLogs((prev) => ({
        ...prev,
        [key]: { ...prev[key], completed: newCompleted },
      }));
      // Save immediately on toggle
      await saveLog(exerciseName, setNumber);
    },
    [logs, saveLog],
  );

  const handleFieldChange = useCallback(
    (exerciseName: string, setNumber: number, field: 'repsCompleted' | 'weight', value: string) => {
      const key = makeKey(exerciseName, setNumber);
      setLogs((prev) => ({
        ...prev,
        [key]: { ...prev[key], [field]: value, saveError: null },
      }));
    },
    [],
  );

  const handleFinishWorkout = useCallback(async () => {
    if (!plannedWorkout) return;

    const anyCompleted = Object.values(logs).some((l) => l.completed);

    const doFinish = async () => {
      setFinishing(true);
      try {
        await finishPlannedWorkout(plannedWorkout.id);
        // Update planner store state
        updatePlannedWorkout(plannedWorkout.planned_date, {
          is_completed: true,
          completed_at: new Date().toISOString(),
        });
        setActivePlannedWorkout(null);
        router.back();
      } catch (e: unknown) {
        Alert.alert('Error', e instanceof Error ? e.message : 'Failed to finish workout.');
      } finally {
        setFinishing(false);
      }
    };

    if (!anyCompleted) {
      Alert.alert(
        'No Sets Logged',
        'You haven\'t logged any sets. Finish anyway?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Finish Anyway', style: 'destructive', onPress: doFinish },
        ],
      );
    } else {
      doFinish();
    }
  }, [plannedWorkout, logs, updatePlannedWorkout, setActivePlannedWorkout, router]);

  const structured = plannedWorkout?.workout?.structured_json as {
    category?: string;
    duration?: number;
    muscle_groups?: string[];
  } | undefined;

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#E8470A" />
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Oops</Text>
          <Text style={styles.errorSubtitle}>{loadError}</Text>
          <TouchableOpacity style={styles.backCta} onPress={() => router.back()}>
            <Text style={styles.backCtaText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} accessibilityLabel="Go back">
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {plannedWorkout?.workout?.title ?? 'Workout'}
        </Text>
        <TouchableOpacity
          style={styles.timerButton}
          onPress={() => setTimerVisible(true)}
          accessibilityLabel="Open rest timer"
        >
          <Text style={styles.timerIcon}>⏱</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero compact summary */}
        <View style={styles.heroCard}>
          <View style={styles.heroRow}>
            {structured?.category ? (
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>{structured.category}</Text>
              </View>
            ) : null}
            {structured?.duration != null ? (
              <Text style={styles.heroDuration}>🕐 {structured.duration} min</Text>
            ) : null}
          </View>
          <Text style={styles.heroTitle}>{plannedWorkout?.workout?.title ?? 'Workout'}</Text>
          {structured?.muscle_groups?.length ? (
            <Text style={styles.heroSubtitle}>{structured.muscle_groups.join(' · ')}</Text>
          ) : null}
        </View>

        {/* Exercise list */}
        {exercises.length === 0 ? (
          <View style={styles.emptyExercises}>
            <Text style={styles.emptyExercisesText}>No exercises found in this workout.</Text>
          </View>
        ) : (
          exercises.map((exercise) => (
            <ExerciseCard
              key={exercise.name}
              exercise={exercise}
              logs={logs}
              onToggleSet={handleToggleSet}
              onFieldChange={handleFieldChange}
              onSaveLog={saveLog}
            />
          ))
        )}

        {/* Finish Workout CTA */}
        <TouchableOpacity
          style={[styles.finishButton, finishing && styles.disabled]}
          onPress={handleFinishWorkout}
          disabled={finishing}
        >
          {finishing ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.finishIcon}>✓</Text>
              <Text style={styles.finishText}>Finish Workout</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Rest Timer Modal */}
      <Modal
        visible={timerVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setTimerVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setTimerVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.timerSheet}>
            <View style={styles.timerHandle} />
            <Text style={styles.timerTitle}>Rest Timer</Text>

            {/* Duration chips */}
            <View style={styles.chipRow}>
              {TIMER_PRESETS.map((secs) => (
                <TouchableOpacity
                  key={secs}
                  style={[styles.chip, selectedDuration === secs && styles.chipActive]}
                  onPress={() => handlePickDuration(secs)}
                >
                  <Text style={[styles.chipText, selectedDuration === secs && styles.chipTextActive]}>
                    {secs}s
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Countdown */}
            <Text style={styles.countdown}>{formatTime(timerSeconds)}</Text>

            {/* Controls */}
            <View style={styles.timerControls}>
              <TouchableOpacity style={styles.timerResetBtn} onPress={handleTimerReset}>
                <Text style={styles.timerResetText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.timerStartBtn, timerRunning && styles.timerPauseBtn]}
                onPress={handleTimerStartPause}
              >
                <Text style={styles.timerStartText}>{timerRunning ? 'Pause' : 'Start'}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.timerCloseBtn} onPress={() => setTimerVisible(false)}>
              <Text style={styles.timerCloseText}>Close</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

interface ExerciseCardProps {
  exercise: ParsedExercise;
  logs: Record<LogKey, LogEntry>;
  onToggleSet: (exerciseName: string, setNumber: number) => void;
  onFieldChange: (exerciseName: string, setNumber: number, field: 'repsCompleted' | 'weight', value: string) => void;
  onSaveLog: (exerciseName: string, setNumber: number) => void;
}

function ExerciseCard({ exercise, logs, onToggleSet, onFieldChange, onSaveLog }: ExerciseCardProps) {
  const setCount = exercise.sets ?? 1;
  const sets = Array.from({ length: setCount }, (_, i) => i + 1);

  return (
    <View style={styles.exerciseCard}>
      <View style={styles.exerciseHeader}>
        <Text style={styles.exerciseName}>{exercise.name}</Text>
        <Text style={styles.exercisePrescription}>
          {setCount} × {exercise.reps ?? '—'} reps
          {exercise.weight != null ? ` @ ${exercise.weight}${exercise.unit ?? 'kg'}` : ''}
        </Text>
      </View>
      <View style={styles.setDivider} />
      {sets.map((setNum) => {
        const key = makeKey(exercise.name, setNum);
        const entry = logs[key] ?? {
          repsCompleted: '',
          weight: '',
          completed: false,
          saving: false,
          saveError: null,
        };
        return (
          <SetRow
            key={setNum}
            setNumber={setNum}
            entry={entry}
            onToggle={() => onToggleSet(exercise.name, setNum)}
            onChangeReps={(v) => onFieldChange(exercise.name, setNum, 'repsCompleted', v)}
            onChangeWeight={(v) => onFieldChange(exercise.name, setNum, 'weight', v)}
            onBlur={() => onSaveLog(exercise.name, setNum)}
          />
        );
      })}
    </View>
  );
}

interface SetRowProps {
  setNumber: number;
  entry: LogEntry;
  onToggle: () => void;
  onChangeReps: (v: string) => void;
  onChangeWeight: (v: string) => void;
  onBlur: () => void;
}

function SetRow({ setNumber, entry, onToggle, onChangeReps, onChangeWeight, onBlur }: SetRowProps) {
  return (
    <View style={styles.setRow}>
      <TouchableOpacity
        style={[styles.checkbox, entry.completed && styles.checkboxCompleted]}
        onPress={onToggle}
        accessibilityLabel={`Set ${setNumber} ${entry.completed ? 'completed' : 'not completed'}`}
      >
        {entry.completed ? <Text style={styles.checkmark}>✓</Text> : null}
      </TouchableOpacity>

      <Text style={styles.setLabel}>Set {setNumber}</Text>

      <TextInput
        style={[styles.setInput, entry.completed && styles.setInputCompleted]}
        value={entry.repsCompleted}
        onChangeText={onChangeReps}
        onBlur={onBlur}
        placeholder="Reps"
        placeholderTextColor="#C7C7CC"
        keyboardType="number-pad"
        returnKeyType="done"
        accessibilityLabel={`Reps for set ${setNumber}`}
      />

      <TextInput
        style={[styles.setInput, entry.completed && styles.setInputCompleted]}
        value={entry.weight}
        onChangeText={onChangeWeight}
        onBlur={onBlur}
        placeholder="kg"
        placeholderTextColor="#C7C7CC"
        keyboardType="decimal-pad"
        returnKeyType="done"
        accessibilityLabel={`Weight for set ${setNumber}`}
      />

      {entry.saving ? (
        <ActivityIndicator size="small" color="#E8470A" style={styles.savingIndicator} />
      ) : null}

      {entry.saveError ? (
        <Text style={styles.saveError}>{entry.saveError}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
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
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginHorizontal: 8,
  },
  timerButton: {
    width: 36,
    alignItems: 'flex-end',
  },
  timerIcon: {
    fontSize: 22,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 16,
  },
  heroCard: {
    backgroundColor: '#E8470A',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  heroBadge: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  heroBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  heroDuration: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
  },
  emptyExercises: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  emptyExercisesText: {
    color: '#8E8E93',
    fontSize: 14,
  },
  exerciseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  exerciseHeader: {
    marginBottom: 10,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  exercisePrescription: {
    fontSize: 13,
    color: '#8E8E93',
  },
  setDivider: {
    height: 1,
    backgroundColor: '#F2F2F7',
    marginBottom: 10,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    flexWrap: 'wrap',
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#D1D1D6',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxCompleted: {
    backgroundColor: '#E8470A',
    borderColor: '#E8470A',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  setLabel: {
    width: 48,
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  setInput: {
    flex: 1,
    height: 36,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 14,
    color: '#1A1A1A',
    textAlign: 'center',
    minWidth: 56,
  },
  setInputCompleted: {
    backgroundColor: '#FFF3EE',
    color: '#E8470A',
  },
  savingIndicator: {
    marginLeft: 4,
  },
  saveError: {
    color: '#FF3B30',
    fontSize: 11,
    width: '100%',
    marginTop: 2,
    marginLeft: 38,
  },
  finishButton: {
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
  },
  disabled: {
    opacity: 0.5,
  },
  finishIcon: {
    color: '#E8470A',
    fontSize: 18,
    fontWeight: '700',
  },
  finishText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  // Error card
  errorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    width: '100%',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 20,
  },
  backCta: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  backCtaText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  timerSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  timerHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D1D6',
    borderRadius: 2,
    marginBottom: 20,
  },
  timerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 20,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  chipActive: {
    backgroundColor: '#FFF3EE',
    borderColor: '#E8470A',
  },
  chipText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#8E8E93',
  },
  chipTextActive: {
    color: '#E8470A',
  },
  countdown: {
    fontSize: 64,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: -2,
    marginBottom: 28,
  },
  timerControls: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  timerResetBtn: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#D1D1D6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerResetText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  timerStartBtn: {
    flex: 2,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#E8470A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerPauseBtn: {
    backgroundColor: '#1A1A1A',
  },
  timerStartText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  timerCloseBtn: {
    paddingVertical: 10,
  },
  timerCloseText: {
    fontSize: 15,
    color: '#8E8E93',
  },
});
