import React, { useState } from 'react';
import { ScrollView, StyleSheet, Alert, View, Platform, TouchableOpacity } from 'react-native';
import { Button, Text, TextInput, SegmentedButtons, Chip } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { TasksStackParamList } from '../../../app/navigation/types';
import { useTaskStore } from '../store/taskStore';
import { Priority, PRIORITY_LABELS } from '../../../shared/constants/priority';
import { WEEKDAY_LABELS, computeFirstDueDate, describeRecurrence } from '../../../core/utils/recurrence';
import type { PriorityValue } from '../../../shared/constants/priority';

type Props = NativeStackScreenProps<TasksStackParamList, 'AddTodo'>;
type RecurrenceType = 'none' | 'weekly' | 'monthly';
type MonthlyType = 'date' | 'first' | 'last';
type PickerMode = 'date';

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AddEditTodoScreen({ navigation, route }: Props) {
  const { personId } = route.params ?? {};
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState('');
  const [priority, setPriority] = useState<PriorityValue>(Priority.MEDIUM);

  const defaultDate = new Date(Date.now() + 86400000);
  const [dueDate, setDueDate] = useState<Date>(defaultDate);
  const [hasDueDate, setHasDueDate] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);

  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('none');
  const [weeklyDay, setWeeklyDay] = useState(0);
  const [monthlyType, setMonthlyType] = useState<MonthlyType>('date');
  const [monthlyDate, setMonthlyDate] = useState('1');
  const [monthlyWeekday, setMonthlyWeekday] = useState(1);

  const [saving, setSaving] = useState(false);
  const { addTodo } = useTaskStore();

  const priorityButtons = [
    { value: String(Priority.HIGH), label: PRIORITY_LABELS[Priority.HIGH] },
    { value: String(Priority.MEDIUM), label: PRIORITY_LABELS[Priority.MEDIUM] },
    { value: String(Priority.LOW), label: PRIORITY_LABELS[Priority.LOW] },
  ];

  function handlePickerChange(_: unknown, selected?: Date) {
    if (Platform.OS === 'android') setPickerVisible(false);
    if (!selected) return;
    const updated = new Date(dueDate);
    updated.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
    setDueDate(updated);
  }

  function buildRecurrence(): string | undefined {
    if (recurrenceType === 'none') return undefined;
    if (recurrenceType === 'weekly') return `weekly:${weeklyDay}`;
    const day = Math.max(1, Math.min(31, Number(monthlyDate) || 1));
    if (monthlyType === 'date') return `monthly:${day}`;
    return `monthly:${monthlyType}:${monthlyWeekday}`;
  }

  async function handleSave() {
    if (!title.trim()) { Alert.alert('Title is required'); return; }
    setSaving(true);
    try {
      const recurrence = buildRecurrence();
      const computedDueDate = recurrence
        ? computeFirstDueDate(recurrence)
        : hasDueDate ? dueDate.getTime() : undefined;
      await addTodo({
        title: title.trim(),
        description: description || undefined,
        priority,
        isRecurring: !!recurrence,
        recurrence,
        dueDate: computedDueDate,
        tags: tags.trim() || undefined,
        estimatedMinutes: estimatedMinutes ? Number(estimatedMinutes) : undefined,
        personId,
      });
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', String(e));
    } finally {
      setSaving(false);
    }
  }

  const recurrencePreview = buildRecurrence();

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text variant="titleMedium" style={styles.section}>Title</Text>
      <TextInput label="Title" value={title} onChangeText={setTitle} mode="outlined" style={styles.input} autoFocus />

      <Text variant="titleMedium" style={styles.section}>Description (optional)</Text>
      <TextInput label="Description" value={description} onChangeText={setDescription} mode="outlined" style={styles.input} multiline numberOfLines={3} />

      {recurrenceType === 'none' && (
        <>
          <View style={styles.dueDateHeader}>
            <Text variant="titleMedium">Due date (optional)</Text>
            <Chip selected={hasDueDate} onPress={() => setHasDueDate(v => !v)} compact>
              {hasDueDate ? 'Set' : 'None'}
            </Chip>
          </View>
          {hasDueDate && (
            Platform.OS === 'ios' ? (
              <DateTimePicker value={dueDate} mode="date" display="inline" onChange={handlePickerChange} minimumDate={new Date()} style={styles.iosPicker} />
            ) : (
              <TouchableOpacity style={styles.dateBtn} onPress={() => setPickerVisible(true)}>
                <Text variant="bodyLarge" style={styles.dateBtnText}>{formatDate(dueDate)}</Text>
              </TouchableOpacity>
            )
          )}
        </>
      )}

      <Text variant="titleMedium" style={styles.section}>Repeat</Text>
      <SegmentedButtons
        value={recurrenceType}
        onValueChange={v => { setRecurrenceType(v as RecurrenceType); if (v !== 'none') setHasDueDate(false); }}
        buttons={[
          { value: 'none', label: 'None' },
          { value: 'weekly', label: 'Weekly' },
          { value: 'monthly', label: 'Monthly' },
        ]}
        style={styles.segmented}
      />
      {recurrenceType === 'weekly' && (
        <View style={styles.chipRow}>
          {WEEKDAY_LABELS.map((label, i) => (
            <Chip key={i} selected={weeklyDay === i} onPress={() => setWeeklyDay(i)} style={styles.dayChip} compact>{label}</Chip>
          ))}
        </View>
      )}
      {recurrenceType === 'monthly' && (
        <>
          <SegmentedButtons
            value={monthlyType}
            onValueChange={v => setMonthlyType(v as MonthlyType)}
            buttons={[
              { value: 'date', label: 'On date' },
              { value: 'first', label: 'First' },
              { value: 'last', label: 'Last' },
            ]}
            style={styles.segmented}
          />
          {monthlyType === 'date' ? (
            <TextInput label="Day of month (1–31)" value={monthlyDate} onChangeText={v => setMonthlyDate(v.replace(/[^0-9]/g, ''))} keyboardType="numeric" mode="outlined" style={styles.input} />
          ) : (
            <View style={styles.chipRow}>
              {WEEKDAY_LABELS.map((label, i) => (
                <Chip key={i} selected={monthlyWeekday === i} onPress={() => setMonthlyWeekday(i)} style={styles.dayChip} compact>{label}</Chip>
              ))}
            </View>
          )}
        </>
      )}
      {recurrencePreview && (
        <Text variant="bodySmall" style={styles.recurrenceHint}>↻ {describeRecurrence(recurrencePreview)}</Text>
      )}

      <Text variant="titleMedium" style={styles.section}>Priority</Text>
      <SegmentedButtons value={String(priority)} onValueChange={v => setPriority(Number(v) as PriorityValue)} buttons={priorityButtons} style={styles.segmented} />

      <Text variant="titleMedium" style={styles.section}>Tags (optional)</Text>
      <TextInput label="Tags (comma-separated)" value={tags} onChangeText={setTags} mode="outlined" style={styles.input} placeholder="e.g. work, health" />

      <Text variant="titleMedium" style={styles.section}>Estimated time (optional)</Text>
      <TextInput label="Minutes" value={estimatedMinutes} onChangeText={v => setEstimatedMinutes(v.replace(/[^0-9]/g, ''))} keyboardType="numeric" mode="outlined" style={styles.input} />

      <Button mode="contained" onPress={handleSave} loading={saving} disabled={saving} style={styles.save}>
        Add Todo
      </Button>

      {pickerVisible && Platform.OS === 'android' && (
        <DateTimePicker value={dueDate} mode={'date' as PickerMode} display="default" onChange={handlePickerChange} minimumDate={new Date()} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  section: { marginTop: 20, marginBottom: 8 },
  input: { marginBottom: 8 },
  segmented: { marginBottom: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  dayChip: { marginBottom: 4 },
  recurrenceHint: { opacity: 0.6, marginBottom: 4, color: '#5C33D4' },
  save: { marginTop: 24, marginBottom: 40 },
  dueDateHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, marginBottom: 8 },
  dateBtn: { backgroundColor: '#EDE9FF', borderRadius: 8, padding: 12, alignItems: 'center', marginBottom: 8 },
  dateBtnText: { color: '#5C33D4', fontWeight: '600' },
  iosPicker: { marginBottom: 8 },
});
