import React, { useEffect } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Text, List, FAB, ActivityIndicator } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { TasksStackParamList } from '../../../app/navigation/types';
import { useTaskStore } from '../store/taskStore';
import { PRIORITY_LABELS } from '../../../shared/constants/priority';
import { TaskStatus } from '../../../shared/constants/taskStatus';

const STATUS_ICON: Record<string, string> = {
  [TaskStatus.PENDING]: 'clock-outline',
  [TaskStatus.IN_PROGRESS]: 'progress-clock',
  [TaskStatus.DONE]: 'check-circle',
  [TaskStatus.MISSED]: 'alert-circle-outline',
  [TaskStatus.DISMISSED]: 'minus-circle-outline',
};

export default function TasksListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<TasksStackParamList>>();
  const { tasks, loading, loadAll } = useTaskStore();

  useEffect(() => { loadAll(); }, [loadAll]);

  const active = tasks.filter(t => t.status !== TaskStatus.DONE && t.status !== TaskStatus.DISMISSED);

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator style={styles.loader} />
      ) : active.length === 0 ? (
        <View style={styles.empty}>
          <Text variant="bodyMedium" style={styles.emptyText}>No tasks. Tap + to add one.</Text>
        </View>
      ) : (
        <FlatList
          data={active}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <List.Item
              title={item.title}
              description={PRIORITY_LABELS[item.priority] + (item.dueDate ? ' · Due ' + new Date(item.dueDate).toLocaleDateString() : '')}
              left={props => <List.Icon {...props} icon={STATUS_ICON[item.status] ?? 'clock-outline'} />}
            />
          )}
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
});
