import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Alert, TouchableOpacity, Linking } from 'react-native';
import { Text, Button, Divider, ActivityIndicator, TextInput, Portal, Dialog, Chip } from 'react-native-paper';
import type { PersonDetailScreenProps } from '../../../app/navigation/types';
import { usePersonStore } from '../../../features/people/store/peopleStore';
import { getItemsByPerson } from '../../../domain/usecases/tasks/GetItemsByPersonUseCase';
import { RELATIONSHIP_LABELS } from '../../../shared/constants/relationships';
import { PRIORITY_LABELS, Priority } from '../../../shared/constants/priority';
import type { Task } from '../../../domain/models/Task';
import type { Todo } from '../../../domain/models/Todo';
import type { Reminder } from '../../../domain/models/Reminder';

const RELATION_COLORS: Record<string, string> = {
  family: '#E53935', friend: '#8E24AA', school: '#1E88E5',
  work: '#43A047', other: '#FB8C00', custom: '#00ACC1',
};

const PRIORITY_COLOR: Record<number, string> = {
  [Priority.HIGH]: '#E53935', [Priority.MEDIUM]: '#FB8C00', [Priority.LOW]: '#43A047',
};

function avatarColor(name: string): string {
  const palette = ['#5B3EBF', '#E53935', '#1E88E5', '#43A047', '#FB8C00', '#8E24AA', '#00ACC1', '#F4511E'];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + h * 31;
  return palette[Math.abs(h) % palette.length];
}

function initials(name: string): string {
  return name.split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

function formatBirthday(birthday: string): string {
  const [, m, d] = birthday.split('-').map(Number);
  return new Date(2000, m - 1, d).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

export default function PersonDetailScreen({ navigation, route }: PersonDetailScreenProps) {
  const { personId } = route.params;
  const { people, connections, deletePerson, loadPeople, loadConnections, addConnection, removeConnection } = usePersonStore();
  const person = people.find(p => p.id === personId);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  const [addConnDialogVisible, setAddConnDialogVisible] = useState(false);
  const [connPersonId, setConnPersonId] = useState('');
  const [connLabel, setConnLabel] = useState('');
  const [connSaving, setConnSaving] = useState(false);

  useEffect(() => {
    loadPeople();
    loadConnections(personId);
    getItemsByPerson(personId).then(({ tasks: t, todos: td, reminders: r }) => {
      setTasks(t); setTodos(td); setReminders(r); setLoading(false);
    });
  }, [personId, loadPeople, loadConnections]);

  async function handleAddConnection() {
    if (!connPersonId || !connLabel.trim()) return;
    setConnSaving(true);
    try {
      await addConnection({ personId, relatedPersonId: connPersonId, label: connLabel.trim() });
      setAddConnDialogVisible(false);
      setConnPersonId(''); setConnLabel('');
    } finally {
      setConnSaving(false);
    }
  }

  function handleDelete() {
    Alert.alert('Delete person', `Remove ${person?.name ?? 'this person'}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deletePerson(personId); navigation.goBack(); } },
    ]);
  }

  if (!person) {
    return <View style={styles.center}><Text>Person not found.</Text></View>;
  }

  const relColor = RELATION_COLORS[person.relationshipType] ?? '#5B3EBF';
  const relLabel = person.customRelation || RELATIONSHIP_LABELS[person.relationshipType];

  const myConnections = connections.filter(c => c.personId === personId || c.relatedPersonId === personId);
  const otherPeople = people.filter(p => p.id !== personId);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Hero header */}
      <View style={[styles.hero, { backgroundColor: avatarColor(person.name) }]}>
        <View style={styles.heroAvatar}>
          <Text style={styles.heroInitials}>{initials(person.name)}</Text>
        </View>
        <Text style={styles.heroName}>{person.name}</Text>
        <View style={[styles.heroBadge, { backgroundColor: relColor + '33', borderColor: relColor }]}>
          <Text style={styles.heroBadgeText}>{relLabel}</Text>
        </View>
      </View>

      {/* Quick actions */}
      <View style={styles.actions}>
        {person.phone ? (
          <TouchableOpacity style={styles.actionBtn} onPress={() => Linking.openURL(`tel:${person.phone}`)}>
            <Text style={styles.actionIcon}>📞</Text>
            <Text style={styles.actionLabel}>Call</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('AddEditPerson', { personId })}>
          <Text style={styles.actionIcon}>✏️</Text>
          <Text style={styles.actionLabel}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={handleDelete}>
          <Text style={styles.actionIcon}>🗑️</Text>
          <Text style={styles.actionLabel}>Delete</Text>
        </TouchableOpacity>
      </View>

      <Divider style={styles.divider} />

      {/* Info rows */}
      <View style={styles.infoSection}>
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>🏷️</Text>
          <Text variant="bodyMedium">{PRIORITY_LABELS[person.priority]} priority</Text>
          <View style={[styles.priorityBadge, { backgroundColor: PRIORITY_COLOR[person.priority] }]} />
        </View>
        {person.birthday ? (
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>🎂</Text>
            <Text variant="bodyMedium">{formatBirthday(person.birthday)}</Text>
          </View>
        ) : null}
        {person.phone ? (
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📞</Text>
            <Text variant="bodyMedium">{person.phone}</Text>
          </View>
        ) : null}
        {person.notes ? (
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📝</Text>
            <Text variant="bodyMedium" style={styles.notes}>{person.notes}</Text>
          </View>
        ) : null}
      </View>

      <Divider style={styles.divider} />

      {/* Connections */}
      <View style={styles.sectionHeader}>
        <Text variant="titleMedium">Connections</Text>
        <Button compact mode="text" onPress={() => setAddConnDialogVisible(true)}>+ Add</Button>
      </View>
      {myConnections.length === 0 ? (
        <Text variant="bodySmall" style={styles.emptySection}>No connections yet.</Text>
      ) : (
        <View style={styles.connList}>
          {myConnections.map(conn => {
            const otherId = conn.personId === personId ? conn.relatedPersonId : conn.personId;
            const other = people.find(p => p.id === otherId);
            return (
              <View key={conn.id} style={styles.connCard}>
                <View style={[styles.connAvatar, { backgroundColor: avatarColor(other?.name ?? '?') }]}>
                  <Text style={styles.connAvatarText}>{initials(other?.name ?? '?')}</Text>
                </View>
                <View style={styles.connBody}>
                  <Text variant="bodyMedium" style={styles.connName}>{other?.name ?? 'Unknown'}</Text>
                  <Chip compact style={styles.connLabelChip}>{conn.label}</Chip>
                </View>
                <TouchableOpacity onPress={() => removeConnection(conn.id)}>
                  <Text style={styles.removeConn}>✕</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}

      <Divider style={styles.divider} />

      {/* Tasks / Todos / Reminders */}
      {loading ? (
        <ActivityIndicator style={styles.loader} />
      ) : (
        <>
          {tasks.length > 0 && (
            <View style={styles.itemsSection}>
              <Text variant="titleSmall" style={styles.itemsSectionTitle}>Tasks ({tasks.length})</Text>
              {tasks.map(t => (
                <View key={t.id} style={styles.itemRow}>
                  <Text style={styles.itemDot}>•</Text>
                  <Text variant="bodyMedium" style={styles.itemTitle}>{t.title}</Text>
                  <Text variant="bodySmall" style={styles.itemMeta}>{t.status}</Text>
                </View>
              ))}
            </View>
          )}
          {todos.length > 0 && (
            <View style={styles.itemsSection}>
              <Text variant="titleSmall" style={styles.itemsSectionTitle}>Todos ({todos.length})</Text>
              {todos.map(t => (
                <View key={t.id} style={styles.itemRow}>
                  <Text style={styles.itemDot}>{t.isCompleted ? '✅' : '⬜'}</Text>
                  <Text variant="bodyMedium" style={[styles.itemTitle, t.isCompleted && styles.strikethrough]}>{t.title}</Text>
                </View>
              ))}
            </View>
          )}
          {reminders.length > 0 && (
            <View style={styles.itemsSection}>
              <Text variant="titleSmall" style={styles.itemsSectionTitle}>Reminders ({reminders.length})</Text>
              {reminders.map(r => (
                <View key={r.id} style={styles.itemRow}>
                  <Text style={styles.itemDot}>🔔</Text>
                  <Text variant="bodyMedium" style={styles.itemTitle}>{r.title}</Text>
                </View>
              ))}
            </View>
          )}
          {tasks.length === 0 && todos.length === 0 && reminders.length === 0 && (
            <Text variant="bodySmall" style={styles.emptySection}>No tasks or reminders linked.</Text>
          )}
        </>
      )}

      {/* Add connection dialog */}
      <Portal>
        <Dialog visible={addConnDialogVisible} onDismiss={() => setAddConnDialogVisible(false)}>
          <Dialog.Title>Add connection</Dialog.Title>
          <Dialog.Content style={styles.dialogContent}>
            <Text variant="bodySmall" style={styles.dialogLabel}>Select person</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.personScroll}>
              {otherPeople.map(p => (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.personChip, connPersonId === p.id && styles.personChipSelected]}
                  onPress={() => setConnPersonId(p.id)}
                >
                  <View style={[styles.personChipAvatar, { backgroundColor: avatarColor(p.name) }]}>
                    <Text style={styles.personChipInitials}>{initials(p.name)}</Text>
                  </View>
                  <Text style={[styles.personChipName, connPersonId === p.id && styles.personChipNameSelected]}>
                    {p.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TextInput
              label="Relationship label"
              value={connLabel}
              onChangeText={setConnLabel}
              mode="outlined"
              placeholder="e.g. husband, sister, manager"
              style={styles.connLabelInput}
              dense
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setAddConnDialogVisible(false)}>Cancel</Button>
            <Button
              mode="contained"
              onPress={handleAddConnection}
              loading={connSaving}
              disabled={!connPersonId || !connLabel.trim() || connSaving}
            >
              Add
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero: { alignItems: 'center', paddingTop: 32, paddingBottom: 24 },
  heroAvatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  heroInitials: { color: '#fff', fontSize: 30, fontWeight: '700' },
  heroName: { color: '#fff', fontSize: 24, fontWeight: '700', marginBottom: 8 },
  heroBadge: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4 },
  heroBadgeText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  actions: { flexDirection: 'row', justifyContent: 'center', gap: 32, paddingVertical: 16 },
  actionBtn: { alignItems: 'center', gap: 4 },
  actionIcon: { fontSize: 24 },
  actionLabel: { fontSize: 12, opacity: 0.7 },
  divider: { marginHorizontal: 16 },
  infoSection: { paddingHorizontal: 20, paddingVertical: 12, gap: 10 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoIcon: { fontSize: 18, width: 28 },
  priorityBadge: { width: 10, height: 10, borderRadius: 5, marginLeft: 4 },
  notes: { flex: 1, fontStyle: 'italic', opacity: 0.7 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  emptySection: { paddingHorizontal: 20, paddingBottom: 12, opacity: 0.4 },
  connList: { paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  connCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', borderRadius: 12, padding: 12, gap: 10 },
  connAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  connAvatarText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  connBody: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  connName: { fontWeight: '600' },
  connLabelChip: { height: 26 },
  removeConn: { fontSize: 16, opacity: 0.4, padding: 4 },
  itemsSection: { paddingHorizontal: 20, paddingTop: 12 },
  itemsSectionTitle: { fontWeight: '700', marginBottom: 6, opacity: 0.7 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  itemDot: { fontSize: 16 },
  itemTitle: { flex: 1 },
  itemMeta: { opacity: 0.4, fontSize: 12 },
  strikethrough: { textDecorationLine: 'line-through', opacity: 0.5 },
  dialogContent: { gap: 4 },
  dialogLabel: { opacity: 0.6, marginBottom: 4 },
  personScroll: { maxHeight: 90 },
  personChip: { alignItems: 'center', marginRight: 12, gap: 4, padding: 4, borderRadius: 8 },
  personChipSelected: { backgroundColor: '#EDE5FF' },
  personChipAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  personChipInitials: { color: '#fff', fontWeight: '700' },
  personChipName: { fontSize: 11, opacity: 0.7, maxWidth: 52, textAlign: 'center' },
  personChipNameSelected: { color: '#5B3EBF', fontWeight: '700' },
  loader: { marginTop: 24 },
  connLabelInput: { marginTop: 12 },
});
