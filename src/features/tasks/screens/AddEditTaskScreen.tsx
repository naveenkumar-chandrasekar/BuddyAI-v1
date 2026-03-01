import React, { useState } from 'react';
import { ScrollView, StyleSheet, Alert, View } from 'react-native';
import { Button, Text, TextInput, SegmentedButtons, Chip } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { TasksStackParamList } from '../../../app/navigation/types';
import { useTaskStore } from '../store/taskStore';
import { Priority, PRIORITY_LABELS } from '../../../shared/constants/priority';
import { TaskItemType } from '../../../shared/constants/taskStatus';
import { WEEKDAY_LABELS, computeFirstDueDate, describeRecurrence } from '../../../core/utils/recurrence';
import type { PriorityValue } from '../../../shared/constants/priority';
import type { TaskItemTypeValue } from '../../../shared/constants/taskStatus';

type Props = NativeStackScreenProps<TasksStackParamList, 'AddEditTask'>;
type RecurrenceType = 'none' | 'weekly' | 'monthly';
type MonthlyType = 'date' | 'first' | 'last';

const TYPE_LABELS: Record<TaskItemTypeValue, string> = {
  task: 'Task',
  todo: 'Todo',
  reminder: 'Reminder',
};

export default function AddEditTaskScreen({ navigation, route }: Props) {
  const { type: initType = TaskItemType.TASK } = route.params ?? {};
  const [type, setType] = useState<TaskItemTypeValue>(initType as TaskItemTypeValue);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<PriorityValue>(Priority.MEDIUM);
  const [remindAt, setRemindAt] = useState('');

  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('none');
  const [weeklyDay, setWeeklyDay] = useState(0);
  const [monthlyType, setMonthlyType] = useState<MonthlyType>('date');
  const [monthlyDate, setMonthlyDate] = useState('1');
  const [monthlyWeekday, setMonthlyWeekday] = useState(1);

  const [saving, setSaving] = useState(false);
  const { addTask, addTodo, addReminder } = useTaskStore();

  const priorityButtons = [
    { value: String(Priority.HIGH), label: PRIORITY_LABELS[Priority.HIGH] },
    { value: String(Priority.MEDIUM), label: PRIORITY_LABELS[Priority.MEDIUM] },
    { value: String(Priority.LOW), label: PRIORITY_LABELS[Priority.LOW] },
  ];

  const typeButtons = Object.values(TaskItemType).map(t => ({
    value: t,
    label: TYPE_LABELS[t],
  }));

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
      if (type === TaskItemType.TASK) {
        await addTask({ title: title.trim(), description: description || undefined, priority });
      } else if (type === TaskItemType.TODO) {
        const recurrence = buildRecurrence();
        const dueDate = recurrence ? computeFirstDueDate(recurrence) : undefined;
        await addTodo({ title: title.trim(), priority, isRecurring: !!recurrence, recurrence, dueDate });
      } else {
        const ts = remindAt ? new Date(remindAt).getTime() : Date.now() + 3600000;
        if (isNaN(ts)) { Alert.alert('Invalid date/time'); setSaving(false); return; }
        await addReminder({ title: title.trim(), description: description || undefined, remindAt: ts, priority });
      }
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
      <Text variant="titleMedium" style={styles.section}>Type</Text>
      <SegmentedButtons value={type} onValueChange={v => setType(v as TaskItemTypeValue)} buttons={typeButtons} style={styles.segmented} />

      <Text variant="titleMedium" style={styles.section}>Title</Text>
      <TextInput label="Title" value={title} onChangeText={setTitle} mode="outlined" style={styles.input} autoFocus />

      {type !== TaskItemType.TODO && (
        <>
          <Text variant="titleMedium" style={styles.section}>Description (optional)</Text>
          <TextInput label="Description" value={description} onChangeText={setDescription} mode="outlined" style={styles.input} multiline numberOfLines={3} />
        </>
      )}

      {type === TaskItemType.REMINDER && (
        <>
          <Text variant="titleMedium" style={styles.section}>Remind at</Text>
          <TextInput
            label="Date & time (YYYY-MM-DD HH:MM)"
            value={remindAt}
            onChangeText={setRemindAt}
            mode="outlined"
            style={styles.input}
            placeholder="2026-03-01 09:00"
          />
        </>
      )}

      {type === TaskItemType.TODO && (
        <>
          <Text variant="titleMedium" style={styles.section}>Repeat</Text>
          <SegmentedButtons
            value={recurrenceType}
            onValueChange={v => setRecurrenceType(v as RecurrenceType)}
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
                <Chip
                  key={i}
                  selected={weeklyDay === i}
                  onPress={() => setWeeklyDay(i)}
                  style={styles.dayChip}
                  compact
                >
                  {label}
                </Chip>
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
                <TextInput
                  label="Day of month (1–31)"
                  value={monthlyDate}
                  onChangeText={v => setMonthlyDate(v.replace(/[^0-9]/g, ''))}
                  keyboardType="numeric"
                  mode="outlined"
                  style={styles.input}
                />
              ) : (
                <View style={styles.chipRow}>
                  {WEEKDAY_LABELS.map((label, i) => (
                    <Chip
                      key={i}
                      selected={monthlyWeekday === i}
                      onPress={() => setMonthlyWeekday(i)}
                      style={styles.dayChip}
                      compact
                    >
                      {label}
                    </Chip>
                  ))}
                </View>
              )}
            </>
          )}

          {recurrencePreview && (
            <Text variant="bodySmall" style={styles.recurrenceHint}>
              ↻ {describeRecurrence(recurrencePreview)}
            </Text>
          )}
        </>
      )}

      <Text variant="titleMedium" style={styles.section}>Priority</Text>
      <SegmentedButtons
        value={String(priority)}
        onValueChange={v => setPriority(Number(v) as PriorityValue)}
        buttons={priorityButtons}
        style={styles.segmented}
      />

      <Button mode="contained" onPress={handleSave} loading={saving} disabled={saving} style={styles.save}>
        Add {TYPE_LABELS[type]}
      </Button>
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
  recurrenceHint: { opacity: 0.6, marginBottom: 4, color: '#5B3EBF' },
  save: { marginTop: 24, marginBottom: 40 },
});
