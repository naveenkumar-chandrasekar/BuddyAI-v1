import React, { useEffect } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Text, List, FAB, ActivityIndicator } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { TasksStackParamList } from '../../../app/navigation/types';
import { useTaskStore } from '../store/taskStore';
import { PRIORITY_LABELS } from '../../../shared/constants/priority';

export default function RemindersListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<TasksStackParamList>>();
  const { reminders, loading, loadAll } = useTaskStore();

  useEffect(() => { loadAll(); }, [loadAll]);

  const now = Date.now();
  const upcoming = reminders.filter(r => !r.isDone && r.remindAt >= now);
  const past = reminders.filter(r => !r.isDone && r.remindAt < now);

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator style={styles.loader} />
      ) : reminders.length === 0 ? (
        <View style={styles.empty}>
          <Text variant="bodyMedium" style={styles.emptyText}>No reminders. Tap + to add one.</Text>
        </View>
      ) : (
        <FlatList
          data={[...upcoming, ...past]}
          keyExtractor={item => item.id}
          renderItem={({ item }) => {
            const overdue = item.remindAt < now;
            return (
              <List.Item
                title={item.title}
                description={
                  (overdue ? '⚠ Overdue · ' : '') +
                  new Date(item.remindAt).toLocaleString() +
                  ' · ' + PRIORITY_LABELS[item.priority]
                }
                left={props => <List.Icon {...props} icon={overdue ? 'alert' : 'bell-outline'} />}
              />
            );
          }}
        />
      )}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('AddEditTask', { type: 'reminder' })}
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
