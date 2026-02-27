import React, { useState } from 'react';
import { ScrollView, StyleSheet, Alert } from 'react-native';
import { Button, Text, TextInput, SegmentedButtons } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { TasksStackParamList } from '../../../app/navigation/types';
import { useTaskStore } from '../store/taskStore';
import { Priority, PRIORITY_LABELS } from '../../../shared/constants/priority';
import { TaskItemType } from '../../../shared/constants/taskStatus';
import type { PriorityValue } from '../../../shared/constants/priority';
import type { TaskItemTypeValue } from '../../../shared/constants/taskStatus';

type Props = NativeStackScreenProps<TasksStackParamList, 'AddEditTask'>;

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

  async function handleSave() {
    if (!title.trim()) { Alert.alert('Title is required'); return; }
    setSaving(true);
    try {
      if (type === TaskItemType.TASK) {
        await addTask({ title: title.trim(), description: description || undefined, priority });
      } else if (type === TaskItemType.TODO) {
        await addTodo({ title: title.trim(), priority });
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
  save: { marginTop: 24, marginBottom: 40 },
});
