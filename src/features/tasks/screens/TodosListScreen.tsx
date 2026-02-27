import React, { useEffect } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Text, List, FAB, ActivityIndicator, Checkbox } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { TasksStackParamList } from '../../../app/navigation/types';
import { useTaskStore } from '../store/taskStore';
import { PRIORITY_LABELS } from '../../../shared/constants/priority';

export default function TodosListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<TasksStackParamList>>();
  const { todos, loading, loadAll, toggleTodo } = useTaskStore();

  useEffect(() => { loadAll(); }, [loadAll]);

  const active = todos.filter(t => !t.isCompleted);
  const done = todos.filter(t => t.isCompleted);

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator style={styles.loader} />
      ) : todos.length === 0 ? (
        <View style={styles.empty}>
          <Text variant="bodyMedium" style={styles.emptyText}>No todos. Tap + to add one.</Text>
        </View>
      ) : (
        <FlatList
          data={[...active, ...done]}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <List.Item
              title={item.title}
              description={PRIORITY_LABELS[item.priority]}
              titleStyle={item.isCompleted ? styles.done : undefined}
              left={() => (
                <Checkbox
                  status={item.isCompleted ? 'checked' : 'unchecked'}
                  onPress={() => toggleTodo(item.id)}
                />
              )}
            />
          )}
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
});
