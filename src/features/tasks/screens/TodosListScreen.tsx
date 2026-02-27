import React, { useEffect } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Text, List, FAB, ActivityIndicator, Checkbox, IconButton, Divider } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { TasksStackParamList } from '../../../app/navigation/types';
import { useTaskStore } from '../store/taskStore';
import { PRIORITY_LABELS } from '../../../shared/constants/priority';
import type { Todo } from '../../../domain/models/Task';

type Row =
  | { key: string; type: 'header'; label: string }
  | { key: string; type: 'item'; todo: Todo };

export default function TodosListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<TasksStackParamList>>();
  const { todos, loading, loadAll, toggleTodo, dismissItem } = useTaskStore();

  useEffect(() => { loadAll(); }, [loadAll]);

  const missed = todos.filter(t => t.isMissed && !t.isDismissed && !t.isCompleted);
  const active = todos.filter(t => !t.isMissed && !t.isDismissed && !t.isCompleted);
  const done = todos.filter(t => t.isCompleted && !t.isDismissed);

  const rows: Row[] = [];
  if (missed.length > 0) {
    rows.push({ key: 'h-missed', type: 'header', label: 'Missed' });
    missed.forEach(t => rows.push({ key: t.id, type: 'item', todo: t }));
  }
  if (active.length > 0) {
    if (missed.length > 0) rows.push({ key: 'h-active', type: 'header', label: 'Active' });
    active.forEach(t => rows.push({ key: t.id, type: 'item', todo: t }));
  }
  if (done.length > 0) {
    rows.push({ key: 'h-done', type: 'header', label: 'Done' });
    done.forEach(t => rows.push({ key: t.id, type: 'item', todo: t }));
  }

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator style={styles.loader} />
      ) : rows.length === 0 ? (
        <View style={styles.empty}>
          <Text variant="bodyMedium" style={styles.emptyText}>No todos. Tap + to add one.</Text>
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
            const { todo } = row;
            return (
              <List.Item
                title={todo.title}
                description={PRIORITY_LABELS[todo.priority]}
                titleStyle={[
                  todo.isCompleted ? styles.done : undefined,
                  todo.isMissed ? styles.missedText : undefined,
                ]}
                left={() => (
                  <Checkbox
                    status={todo.isCompleted ? 'checked' : 'unchecked'}
                    onPress={() => toggleTodo(todo.id)}
                  />
                )}
                right={todo.isMissed ? () => (
                  <IconButton
                    icon="close-circle-outline"
                    size={20}
                    onPress={() => dismissItem('todo', todo.id)}
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
        onPress={() => navigation.navigate('AddEditTask', { type: 'todo' })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { flex: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { opacity: 0.5 },
  done: { textDecorationLine: 'line-through', opacity: 0.5 },
  fab: { position: 'absolute', right: 16, bottom: 16 },
  sectionHeader: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4, opacity: 0.6 },
  missedHeader: { color: '#c62828' },
  missedText: { color: '#c62828' },
});
