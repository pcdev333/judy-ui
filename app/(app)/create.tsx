import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { parseWorkout, saveWorkout } from '@/lib/api';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { ParsedWorkout } from '@/types';
import FAB from '@/components/ui/FAB';

type Step = 'input' | 'preview' | 'saved';

export default function CreateScreen() {
  const router = useRouter();
  const { setParsedWorkout } = useWorkoutStore();
  const [step, setStep] = useState<Step>('input');
  const [inputText, setInputText] = useState('');
  const [parsed, setParsed] = useState<ParsedWorkout | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleParse() {
    if (!inputText.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await parseWorkout(inputText.trim());
      setParsed(result);
      setParsedWorkout(result);
      setStep('preview');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to parse workout. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!parsed) return;
    setSaving(true);
    setError(null);
    try {
      await saveWorkout(parsed.title, inputText, parsed);
      setStep('saved');
      setTimeout(() => {
        router.replace('/(app)/library');
      }, 1500);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save workout. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function handleVoiceInput() {
    Alert.alert('Voice Input', 'Voice input is not available on this device.');
  }

  if (step === 'saved') {
    return (
      <View style={styles.container}>
        <View style={styles.savedContainer}>
          <Text style={styles.savedIcon}>✅</Text>
          <Text style={styles.savedTitle}>Workout Saved!</Text>
          <Text style={styles.savedSubtitle}>Taking you to your library…</Text>
        </View>
      </View>
    );
  }

  if (step === 'preview' && parsed) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setStep('input')} style={styles.backButton}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Preview Workout</Text>
          <View style={styles.backButton} />
        </View>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.previewTitle}>{parsed.title}</Text>
          {parsed.category ? (
            <Text style={styles.previewMeta}>{parsed.category}</Text>
          ) : null}
          {parsed.muscle_groups && parsed.muscle_groups.length > 0 ? (
            <Text style={styles.previewMeta}>{parsed.muscle_groups.join(' · ')}</Text>
          ) : null}
          <View style={styles.exerciseList}>
            {parsed.exercises.map((ex, idx) => (
              <View key={idx} style={styles.exerciseRow}>
                <Text style={styles.exerciseName}>{ex.name}</Text>
                <Text style={styles.exerciseDetail}>
                  {ex.sets} × {ex.reps}
                  {ex.weight ? ` @ ${ex.weight}${ex.unit ?? 'lbs'}` : ''}
                </Text>
              </View>
            ))}
          </View>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <TouchableOpacity
            onPress={handleSave}
            style={[styles.ctaPrimary, saving && styles.disabled]}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.ctaPrimaryText}>Save Workout</Text>
                <Text style={styles.ctaIcon}>🟠</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setStep('input')} style={styles.ctaSecondary}>
            <Text style={styles.ctaSecondaryText}>Edit</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Workout</Text>
        <View style={styles.backButton} />
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <TextInput
          style={styles.textInput}
          multiline
          placeholder="Describe your workout... e.g. Push day: bench press 4x8 @ 135lbs, shoulder press 3x10..."
          placeholderTextColor="#C7C7CC"
          value={inputText}
          onChangeText={setInputText}
          textAlignVertical="top"
        />
        <Text style={styles.charCount}>{inputText.length} characters</Text>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color="#E8470A" />
            <Text style={styles.loadingText}>Analyzing your workout… 🧠</Text>
          </View>
        ) : (
          <TouchableOpacity
            onPress={handleParse}
            style={[styles.ctaPrimary, !inputText.trim() && styles.disabled]}
            disabled={!inputText.trim()}
          >
            <Text style={styles.ctaPrimaryText}>Parse & Save</Text>
            <Text style={styles.ctaIcon}>🟠</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
      <FAB onPress={handleVoiceInput} icon="🎤" />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: '#1A1A1A',
    minHeight: 180,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    marginBottom: 8,
  },
  charCount: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'right',
    marginBottom: 20,
  },
  errorText: {
    fontSize: 13,
    color: '#FF3B30',
    marginBottom: 12,
    textAlign: 'center',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#8E8E93',
    marginLeft: 8,
  },
  ctaPrimary: {
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 8,
  },
  ctaPrimaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  ctaIcon: {
    fontSize: 16,
    marginLeft: 6,
  },
  ctaSecondary: {
    borderWidth: 1.5,
    borderColor: '#D1D1D6',
    borderStyle: 'dashed',
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    backgroundColor: '#FFFFFF',
  },
  ctaSecondaryText: {
    color: '#1A1A1A',
    fontSize: 16,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.4,
  },
  previewTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  previewMeta: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 4,
  },
  exerciseList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  exerciseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
  },
  exerciseDetail: {
    fontSize: 13,
    color: '#8E8E93',
  },
  savedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  savedTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  savedSubtitle: {
    fontSize: 15,
    color: '#8E8E93',
  },
});

