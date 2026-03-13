import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Text, List, FAB, ActivityIndicator, Checkbox, IconButton, Divider, Chip, TextInput } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { TasksStackParamList } from '../../../app/navigation/types';
import { useTaskStore } from '../store/taskStore';
import { PRIORITY_LABELS } from '../../../shared/constants/priority';
import { describeRecurrence } from '../../../core/utils/recurrence';
import type { Todo } from '../../../domain/models/Todo';

type Row =
  | { key: string; type: 'header'; label: string }
  | { key: string; type: 'item'; todo: Todo };

export default function TodosListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<TasksStackParamList>>();
  const {
    todos, todoItems, loading,
    loadAll, toggleTodo, dismissItem,
    loadTodoItems, addTodoItem, toggleTodoItem, deleteTodoItem,
  } = useTaskStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newItemText, setNewItemText] = useState('');

  useEffect(() => { loadAll(); }, [loadAll]);

  function toggleExpand(id: string) {
    if (expandedId === id) {
      setExpandedId(null);
      setNewItemText('');
    } else {
      setExpandedId(id);
      setNewItemText('');
      loadTodoItems(id);
    }
  }

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
            const isExpanded = expandedId === todo.id;
            const items = todoItems[todo.id] ?? [];

            const descParts = [PRIORITY_LABELS[todo.priority]];
            if (todo.isRecurring && todo.recurrence) descParts.push(describeRecurrence(todo.recurrence));
            if (todo.estimatedMinutes) descParts.push(`~${todo.estimatedMinutes}m`);
            if (todo.description) descParts.push(todo.description);

            return (
              <View>
                <List.Item
                  title={todo.title}
                  description={descParts.join(' · ')}
                  titleStyle={[
                    todo.isCompleted ? styles.done : undefined,
                    todo.isMissed ? styles.missedText : undefined,
                  ]}
                  onPress={() => toggleExpand(todo.id)}
                  left={() => (
                    <Checkbox
                      status={todo.isCompleted ? 'checked' : 'unchecked'}
                      onPress={() => toggleTodo(todo.id)}
                    />
                  )}
                  right={() => (
                    <View style={styles.rowActions}>
                      {todo.isMissed && (
                        <IconButton
                          icon="close-circle-outline"
                          size={20}
                          onPress={() => dismissItem('todo', todo.id)}
                        />
                      )}
                      <IconButton
                        icon={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        onPress={() => toggleExpand(todo.id)}
                      />
                    </View>
                  )}
                />
                {todo.tags ? (
                  <View style={styles.chipRow}>
                    {todo.tags.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
                      <Chip key={tag} compact style={styles.chip}>{tag}</Chip>
                    ))}
                  </View>
                ) : null}
                {isExpanded && (
                  <View style={styles.subItems}>
                    {items.map(item => (
                      <List.Item
                        key={item.id}
                        title={item.title}
                        titleStyle={item.isCompleted ? styles.done : undefined}
                        style={styles.subItem}
                        left={() => (
                          <Checkbox
                            status={item.isCompleted ? 'checked' : 'unchecked'}
                            onPress={() => toggleTodoItem(item.id)}
                          />
                        )}
                        right={() => (
                          <IconButton
                            icon="close"
                            size={16}
                            onPress={() => deleteTodoItem(item.id, todo.id)}
                          />
                        )}
                      />
                    ))}
                    <View style={styles.addItemRow}>
                      <TextInput
                        value={newItemText}
                        onChangeText={setNewItemText}
                        placeholder="Add checklist item..."
                        dense
                        mode="outlined"
                        style={styles.addItemInput}
                      />
                      <IconButton
                        icon="plus-circle"
                        onPress={async () => {
                          if (!newItemText.trim()) return;
                          await addTodoItem({ todoId: todo.id, title: newItemText.trim() });
                          setNewItemText('');
                        }}
                      />
                    </View>
                  </View>
                )}
              </View>
            );
          }}
        />
      )}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('AddTodo', {})}
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
  missedHeader: { color: '#DC2626' },
  missedText: { color: '#DC2626' },
  rowActions: { flexDirection: 'row', alignItems: 'center' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, paddingHorizontal: 16, paddingBottom: 4 },
  chip: { height: 24 },
  subItems: { backgroundColor: '#EEE8FF', paddingLeft: 16, paddingBottom: 8 },
  subItem: { paddingVertical: 0 },
  addItemRow: { flexDirection: 'row', alignItems: 'center', paddingRight: 8 },
  addItemInput: { flex: 1 },
});
