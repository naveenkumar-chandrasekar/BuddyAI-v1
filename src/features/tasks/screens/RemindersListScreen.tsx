import React, { useEffect } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Text, List, FAB, ActivityIndicator, IconButton, Divider, Chip } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { TasksStackParamList } from '../../../app/navigation/types';
import { useTaskStore } from '../store/taskStore';
import { PRIORITY_LABELS } from '../../../shared/constants/priority';
import type { Reminder } from '../../../domain/models/Reminder';

type Row =
  | { key: string; type: 'header'; label: string }
  | { key: string; type: 'item'; reminder: Reminder };

export default function RemindersListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<TasksStackParamList>>();
  const { reminders, loading, loadAll, dismissItem, doneReminder, snoozeReminder } = useTaskStore();

  useEffect(() => { loadAll(); }, [loadAll]);

  const now = Date.now();
  const overdue = reminders.filter(r => !r.isDone && !r.isDismissed && r.remindAt < now);
  const upcoming = reminders.filter(r => !r.isDone && !r.isDismissed && r.remindAt >= now);
  const done = reminders.filter(r => r.isDone && !r.isDismissed);

  const rows: Row[] = [];
  if (overdue.length > 0) {
    rows.push({ key: 'h-overdue', type: 'header', label: 'Overdue' });
    overdue.forEach(r => rows.push({ key: r.id, type: 'item', reminder: r }));
  }
  if (upcoming.length > 0) {
    if (overdue.length > 0) rows.push({ key: 'h-upcoming', type: 'header', label: 'Upcoming' });
    upcoming.forEach(r => rows.push({ key: r.id, type: 'item', reminder: r }));
  }
  if (done.length > 0) {
    rows.push({ key: 'h-done', type: 'header', label: 'Done' });
    done.forEach(r => rows.push({ key: r.id, type: 'item', reminder: r }));
  }

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator style={styles.loader} />
      ) : rows.length === 0 ? (
        <View style={styles.empty}>
          <Text variant="bodyMedium" style={styles.emptyText}>No reminders. Tap + to add one.</Text>
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
                  style={[styles.sectionHeader, row.label === 'Overdue' && styles.overdueHeader]}
                >
                  {row.label}
                </Text>
              );
            }
            const { reminder } = row;
            const isOverdue = reminder.remindAt < now && !reminder.isDone;
            const isSnoozed = !!(reminder.snoozeUntil && reminder.snoozeUntil > now);

            const descParts: string[] = [];
            if (isOverdue) descParts.push('⚠ Overdue');
            descParts.push(new Date(reminder.remindAt).toLocaleString('en-US', {
              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
            }));
            descParts.push(PRIORITY_LABELS[reminder.priority]);
            if (isSnoozed && reminder.snoozeUntil) {
              descParts.push('Snoozed → ' + new Date(reminder.snoozeUntil).toLocaleTimeString('en-US', {
                hour: '2-digit', minute: '2-digit',
              }));
            }

            const icon = reminder.isDone
              ? 'check-circle'
              : isSnoozed
              ? 'bell-sleep-outline'
              : isOverdue
              ? 'alert'
              : 'bell-outline';

            return (
              <View>
                <List.Item
                  title={reminder.title}
                  description={descParts.join(' · ')}
                  titleStyle={[
                    isOverdue ? styles.overdueText : undefined,
                    reminder.isDone ? styles.doneText : undefined,
                  ]}
                  left={props => <List.Icon {...props} icon={icon} />}
                  right={!reminder.isDone ? () => (
                    <View style={styles.rowActions}>
                      <IconButton
                        icon="check-circle-outline"
                        size={22}
                        iconColor="#2e7d32"
                        onPress={() => doneReminder(reminder.id)}
                      />
                      {isOverdue ? (
                        <IconButton
                          icon="close-circle-outline"
                          size={22}
                          onPress={() => dismissItem('reminder', reminder.id)}
                        />
                      ) : (
                        <IconButton
                          icon="alarm-snooze"
                          size={22}
                          onPress={() => snoozeReminder(reminder.id, 3600000)}
                        />
                      )}
                    </View>
                  ) : undefined}
                />
                {reminder.tags ? (
                  <View style={styles.chipRow}>
                    {reminder.tags.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
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
        onPress={() => navigation.navigate('AddReminder', {})}
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
  overdueHeader: { color: '#DC2626' },
  overdueText: { color: '#DC2626' },
  doneText: { opacity: 0.5 },
  rowActions: { flexDirection: 'row', alignItems: 'center' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, paddingHorizontal: 16, paddingBottom: 8 },
  chip: { height: 24 },
});
