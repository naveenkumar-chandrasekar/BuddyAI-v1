import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Text, Button, Divider, List, ActivityIndicator } from 'react-native-paper';
import type { PersonDetailScreenProps } from '../../../app/navigation/types';
import { usePeopleStore } from '../store/peopleStore';
import { getItemsByPerson } from '../../../domain/usecases/tasks/GetTasksUseCase';
import { RELATIONSHIP_LABELS } from '../../../shared/constants/relationships';
import { PRIORITY_LABELS } from '../../../shared/constants/priority';
import type { Task, Todo, Reminder } from '../../../domain/models/Task';

export default function PersonDetailScreen({ navigation, route }: PersonDetailScreenProps) {
  const { personId } = route.params;
  const { people, deletePerson } = usePeopleStore();
  const person = people.find(p => p.id === personId);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getItemsByPerson(personId).then(({ tasks: t, todos: td, reminders: r }) => {
      setTasks(t);
      setTodos(td);
      setReminders(r);
      setLoading(false);
    });
  }, [personId]);

  function handleDelete() {
    Alert.alert('Delete person', `Remove ${person?.name ?? 'this person'}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deletePerson(personId);
          navigation.goBack();
        },
      },
    ]);
  }

  if (!person) {
    return (
      <View style={styles.center}>
        <Text>Person not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium">{person.name}</Text>
        <Text variant="bodyMedium" style={styles.meta}>
          {RELATIONSHIP_LABELS[person.relationshipType]} · {PRIORITY_LABELS[person.priority]}
        </Text>
        {person.birthday ? <Text variant="bodySmall">🎂 {person.birthday}</Text> : null}
        {person.phone ? <Text variant="bodySmall">📞 {person.phone}</Text> : null}
        {person.notes ? (
          <Text variant="bodyMedium" style={styles.notes}>{person.notes}</Text>
        ) : null}
      </View>
      <View style={styles.actions}>
        <Button
          mode="contained-tonal"
          onPress={() => navigation.navigate('AddEditPerson', { personId })}
          style={styles.actionBtn}
        >
          Edit
        </Button>
        <Button
          mode="contained-tonal"
          textColor="red"
          onPress={handleDelete}
          style={styles.actionBtn}
        >
          Delete
        </Button>
      </View>
      <Divider />
      {loading ? (
        <ActivityIndicator style={styles.loader} />
      ) : (
        <>
          <List.Section title={`Tasks (${tasks.length})`}>
            {tasks.map(t => (
              <List.Item key={t.id} title={t.title} description={t.status} />
            ))}
          </List.Section>
          <List.Section title={`Todos (${todos.length})`}>
            {todos.map(t => (
              <List.Item
                key={t.id}
                title={t.title}
                left={props => (
                  <List.Icon {...props} icon={t.isCompleted ? 'check-circle' : 'circle-outline'} />
                )}
              />
            ))}
          </List.Section>
          <List.Section title={`Reminders (${reminders.length})`}>
            {reminders.map(r => (
              <List.Item key={r.id} title={r.title} />
            ))}
          </List.Section>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { padding: 20 },
  meta: { opacity: 0.6, marginTop: 4, marginBottom: 8 },
  notes: { marginTop: 12, fontStyle: 'italic' },
  actions: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 12, gap: 12 },
  actionBtn: { flex: 1 },
  loader: { marginTop: 24 },
});
