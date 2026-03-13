import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Text, List, FAB, ActivityIndicator, IconButton, Divider, Menu, Chip } from 'react-native-paper';
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
  [TaskStatus.CANCELLED]: 'cancel',
};

type Row =
  | { key: string; type: 'header'; label: string }
  | { key: string; type: 'item'; task: Task };

export default function TasksListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<TasksStackParamList>>();
  const { tasks, loading, loadAll, dismissItem, completeTask, cancelTask, deleteTask } = useTaskStore();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => { loadAll(); }, [loadAll]);

  const missed = tasks.filter(
    t => t.isMissed && !t.isDismissed && t.status !== TaskStatus.DONE && t.status !== TaskStatus.CANCELLED,
  );
  const active = tasks.filter(
    t => !t.isMissed && !t.isDismissed &&
      t.status !== TaskStatus.DONE && t.status !== TaskStatus.DISMISSED && t.status !== TaskStatus.CANCELLED,
  );
  const cancelled = tasks.filter(t => t.status === TaskStatus.CANCELLED && !t.isDismissed);

  const rows: Row[] = [];
  if (missed.length > 0) {
    rows.push({ key: 'h-missed', type: 'header', label: 'Missed' });
    missed.forEach(t => rows.push({ key: t.id, type: 'item', task: t }));
  }
  if (active.length > 0) {
    if (missed.length > 0) rows.push({ key: 'h-active', type: 'header', label: 'Active' });
    active.forEach(t => rows.push({ key: t.id, type: 'item', task: t }));
  }
  if (cancelled.length > 0) {
    rows.push({ key: 'h-cancelled', type: 'header', label: 'Cancelled' });
    cancelled.forEach(t => rows.push({ key: t.id, type: 'item', task: t }));
  }

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
                  style={[
                    styles.sectionHeader,
                    row.label === 'Missed' && styles.missedHeader,
                    row.label === 'Cancelled' && styles.cancelledHeader,
                  ]}
                >
                  {row.label}
                </Text>
              );
            }
            const { task } = row;
            const isCancelled = task.status === TaskStatus.CANCELLED;
            const descParts = [PRIORITY_LABELS[task.priority]];
            if (task.dueDate) descParts.push('Due ' + new Date(task.dueDate).toLocaleDateString());
            if (task.estimatedMinutes) descParts.push(`~${task.estimatedMinutes}m`);
            if (task.isRecurring) descParts.push('↻ recurring');
            const desc = descParts.join(' · ');

            return (
              <View>
                <List.Item
                  title={task.title}
                  description={desc}
                  titleStyle={[
                    task.isMissed && !isCancelled ? styles.missedText : undefined,
                    isCancelled ? styles.cancelledText : undefined,
                  ]}
                  left={props => <List.Icon {...props} icon={STATUS_ICON[task.status] ?? 'clock-outline'} />}
                  right={() => (
                    <View style={styles.rowActions}>
                      {task.isMissed && !isCancelled && (
                        <IconButton
                          icon="close-circle-outline"
                          size={20}
                          onPress={() => dismissItem('task', task.id)}
                        />
                      )}
                      <Menu
                        visible={openMenuId === task.id}
                        onDismiss={() => setOpenMenuId(null)}
                        anchor={
                          <IconButton
                            icon="dots-vertical"
                            size={20}
                            onPress={() => setOpenMenuId(task.id)}
                          />
                        }
                      >
                        {!isCancelled && task.status !== TaskStatus.DONE && (
                          <Menu.Item
                            leadingIcon="check-circle-outline"
                            title="Complete"
                            onPress={() => { completeTask(task.id); setOpenMenuId(null); }}
                          />
                        )}
                        {!isCancelled && task.status !== TaskStatus.DONE && (
                          <Menu.Item
                            leadingIcon="cancel"
                            title="Cancel"
                            onPress={() => { cancelTask(task.id); setOpenMenuId(null); }}
                          />
                        )}
                        <Menu.Item
                          leadingIcon="delete-outline"
                          title="Delete"
                          onPress={() => { deleteTask(task.id); setOpenMenuId(null); }}
                        />
                      </Menu>
                    </View>
                  )}
                />
                {task.tags ? (
                  <View style={styles.chipRow}>
                    {task.tags.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
                      <Chip key={tag} compact style={styles.chip}>{tag}</Chip>
                    ))}
                  </View>
                ) : null}
              </View>
            );
          }}
        />
      )}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('AddTask', {})}
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
  missedHeader: { color: '#DC2626' },
  cancelledHeader: { color: '#757575' },
  missedText: { color: '#DC2626' },
  cancelledText: { color: '#9e9e9e', textDecorationLine: 'line-through' },
  rowActions: { flexDirection: 'row', alignItems: 'center' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, paddingHorizontal: 16, paddingBottom: 8 },
  chip: { height: 24 },
});
