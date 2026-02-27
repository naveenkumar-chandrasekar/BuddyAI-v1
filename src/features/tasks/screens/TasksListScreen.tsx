import React, { useEffect } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Text, List, FAB, ActivityIndicator, IconButton, Divider } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { TasksStackParamList } from '../../../app/navigation/types';
import { useTaskStore } from '../store/taskStore';
import { PRIORITY_LABELS } from '../../../shared/constants/priority';
import { TaskStatus } from '../../../shared/constants/taskStatus';
import type { Task } from '../../../domain/models/Task';

const STATUS_ICON: Record<string, string> = {
  [TaskStatus.PENDING]: 'clock-outline',
  [TaskStatus.IN_PROGRESS]: 'progress-clock',
  [TaskStatus.DONE]: 'check-circle',
  [TaskStatus.MISSED]: 'alert-circle-outline',
  [TaskStatus.DISMISSED]: 'minus-circle-outline',
};

type Row =
  | { key: string; type: 'header'; label: string }
  | { key: string; type: 'item'; task: Task };

export default function TasksListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<TasksStackParamList>>();
  const { tasks, loading, loadAll, dismissItem } = useTaskStore();

  useEffect(() => { loadAll(); }, [loadAll]);

  const missed = tasks.filter(t => t.isMissed && !t.isDismissed && t.status !== TaskStatus.DONE);
  const active = tasks.filter(t => !t.isMissed && !t.isDismissed && t.status !== TaskStatus.DONE && t.status !== TaskStatus.DISMISSED);

  const rows: Row[] = [];
  if (missed.length > 0) {
    rows.push({ key: 'h-missed', type: 'header', label: 'Missed' });
    missed.forEach(t => rows.push({ key: t.id, type: 'item', task: t }));
    if (active.length > 0) rows.push({ key: 'h-active', type: 'header', label: 'Active' });
  }
  active.forEach(t => rows.push({ key: t.id, type: 'item', task: t }));

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator style={styles.loader} />
      ) : rows.length === 0 ? (
        <View style={styles.empty}>
          <Text variant="bodyMedium" style={styles.emptyText}>No tasks. Tap + to add one.</Text>
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={r => r.key}
          ItemSeparatorComponent={() => <Divider />}
          renderItem={({ item: row }) => {
            if (row.type === 'header') {
              return (
                <Text
                  variant="labelLarge"
                  style={[styles.sectionHeader, row.label === 'Missed' && styles.missedHeader]}
                >
                  {row.label}
                </Text>
              );
            }
            const { task } = row;
            return (
              <List.Item
                title={task.title}
                description={PRIORITY_LABELS[task.priority] + (task.dueDate ? ' · Due ' + new Date(task.dueDate).toLocaleDateString() : '')}
                titleStyle={task.isMissed ? styles.missedText : undefined}
                left={props => <List.Icon {...props} icon={STATUS_ICON[task.status] ?? 'clock-outline'} />}
                right={task.isMissed ? () => (
                  <IconButton
                    icon="close-circle-outline"
                    size={20}
                    onPress={() => dismissItem('task', task.id)}
                  />
                ) : undefined}
              />
            );
          }}
        />
      )}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('AddEditTask', { type: 'task' })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { flex: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { opacity: 0.5 },
  fab: { position: 'absolute', right: 16, bottom: 16 },
  sectionHeader: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4, opacity: 0.6 },
  missedHeader: { color: '#c62828' },
  missedText: { color: '#c62828' },
});
