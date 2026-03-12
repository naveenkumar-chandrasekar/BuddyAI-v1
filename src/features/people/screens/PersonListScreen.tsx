import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Searchbar, Chip, FAB, ActivityIndicator, Surface } from 'react-native-paper';
import type { PersonListScreenProps } from '../../../app/navigation/types';
import { usePersonStore } from '../../../features/people/store/peopleStore';
import { RELATIONSHIP_LABELS, RelationshipType } from '../../../shared/constants/relationships';
import { Priority } from '../../../shared/constants/priority';
import type { Person } from '../../../domain/models/Person';

const RELATION_COLORS: Record<string, string> = {
  family: '#E53935',
  friend: '#8E24AA',
  school: '#1E88E5',
  work: '#43A047',
  other: '#FB8C00',
  custom: '#00ACC1',
};

const PRIORITY_DOT: Record<number, string> = {
  [Priority.HIGH]: '#E53935',
  [Priority.MEDIUM]: '#FB8C00',
  [Priority.LOW]: '#43A047',
};

function avatarColor(name: string): string {
  const palette = ['#5B3EBF', '#E53935', '#1E88E5', '#43A047', '#FB8C00', '#8E24AA', '#00ACC1', '#F4511E'];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + h * 31;
  return palette[Math.abs(h) % palette.length];
}

function initials(name: string): string {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

function birthdayDaysLeft(birthday: string | null): number | null {
  if (!birthday) return null;
  const [, m, d] = birthday.split('-').map(Number);
  const now = new Date();
  const bd = new Date(now.getFullYear(), m - 1, d);
  if (bd < now) bd.setFullYear(now.getFullYear() + 1);
  return Math.ceil((bd.getTime() - now.getTime()) / 86400000);
}

const FILTERS = [
  { label: 'All', value: null },
  { label: 'Family', value: RelationshipType.FAMILY },
  { label: 'Friend', value: RelationshipType.FRIEND },
  { label: 'School', value: RelationshipType.SCHOOL },
  { label: 'Work', value: RelationshipType.WORK },
  { label: 'Other', value: RelationshipType.OTHER },
];

function PersonCard({ person, onPress }: { person: Person; onPress: () => void }) {
  const daysLeft = birthdayDaysLeft(person.birthday);
  const showBirthday = daysLeft !== null && daysLeft <= 14;
  const relColor = RELATION_COLORS[person.relationshipType] ?? '#5B3EBF';

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75}>
      <Surface style={styles.card} elevation={1}>
        <View style={[styles.avatar, { backgroundColor: avatarColor(person.name) }]}>
          <Text style={styles.avatarText}>{initials(person.name)}</Text>
        </View>
        <View style={styles.cardBody}>
          <View style={styles.cardRow}>
            <Text variant="titleMedium" style={styles.cardName}>{person.name}</Text>
            <View style={[styles.priorityDot, { backgroundColor: PRIORITY_DOT[person.priority] }]} />
          </View>
          <View style={styles.cardTags}>
            <View style={[styles.relBadge, { backgroundColor: relColor + '22', borderColor: relColor }]}>
              <Text style={[styles.relBadgeText, { color: relColor }]}>
                {person.customRelation || RELATIONSHIP_LABELS[person.relationshipType]}
              </Text>
            </View>
            {person.phone ? (
              <Text variant="bodySmall" style={styles.phone}>{person.phone}</Text>
            ) : null}
          </View>
          {showBirthday && (
            <Text variant="bodySmall" style={styles.birthday}>
              {daysLeft === 0 ? '🎂 Birthday today!' : `🎂 Birthday in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`}
            </Text>
          )}
        </View>
        <Text style={styles.chevron}>›</Text>
      </Surface>
    </TouchableOpacity>
  );
}

export default function PersonListScreen({ navigation }: PersonListScreenProps) {
  const { people, loading, loadPeople, searchPeople, filterByRelationship } = usePersonStore();
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  useEffect(() => { loadPeople(); }, [loadPeople]);

  function onSearch(text: string) {
    setQuery(text);
    searchPeople(text);
  }

  function onFilter(value: string | null) {
    setActiveFilter(value);
    filterByRelationship(value);
  }

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search people…"
        value={query}
        onChangeText={onSearch}
        style={styles.search}
        elevation={0}
      />
      <View style={styles.chips}>
        {FILTERS.map(f => (
          <Chip
            key={String(f.value)}
            selected={activeFilter === f.value}
            onPress={() => onFilter(f.value)}
            style={styles.chip}
            compact
          >
            {f.label}
          </Chip>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} />
      ) : people.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>👥</Text>
          <Text variant="bodyMedium" style={styles.emptyText}>No people yet.</Text>
          <Text variant="bodySmall" style={styles.emptyHint}>Tap + to add someone.</Text>
        </View>
      ) : (
        <FlatList
          data={people}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <PersonCard
              person={item}
              onPress={() => navigation.navigate('PersonDetail', { personId: item.id })}
            />
          )}
          contentContainerStyle={styles.list}
        />
      )}

      <FAB icon="plus" style={styles.fab} onPress={() => navigation.navigate('AddEditPerson', {})} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  search: { margin: 12, borderRadius: 12, backgroundColor: '#fff' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, marginBottom: 4 },
  chip: { marginRight: 6, marginBottom: 6 },
  loader: { flex: 1 },
  list: { padding: 12, paddingBottom: 80 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  emptyIcon: { fontSize: 48 },
  emptyText: { opacity: 0.6 },
  emptyHint: { opacity: 0.4 },
  fab: { position: 'absolute', right: 16, bottom: 16 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 18 },
  cardBody: { flex: 1 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardName: { fontWeight: '600', flex: 1 },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  cardTags: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' },
  relBadge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  relBadgeText: { fontSize: 11, fontWeight: '600' },
  phone: { opacity: 0.5, fontSize: 12 },
  birthday: { marginTop: 4, color: '#E53935', fontSize: 12 },
  chevron: { fontSize: 22, opacity: 0.3, marginLeft: 8 },
});
