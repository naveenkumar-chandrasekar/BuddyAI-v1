import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Text, Searchbar, Chip, FAB, List, ActivityIndicator } from 'react-native-paper';
import type { PeopleListScreenProps } from '../../../app/navigation/types';
import { usePeopleStore } from '../store/peopleStore';
import { RELATIONSHIP_LABELS, RelationshipType } from '../../../shared/constants/relationships';
import { PRIORITY_LABELS } from '../../../shared/constants/priority';

const FILTERS = [
  { label: 'All', value: null },
  { label: 'Family', value: RelationshipType.FAMILY },
  { label: 'College', value: RelationshipType.COLLEGE },
  { label: 'School', value: RelationshipType.SCHOOL },
  { label: 'Office', value: RelationshipType.OFFICE },
];

export default function PeopleListScreen({ navigation }: PeopleListScreenProps) {
  const { people, loading, loadPeople, searchPeople, filterByRelationship } = usePeopleStore();
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
        placeholder="Search people"
        value={query}
        onChangeText={onSearch}
        style={styles.search}
      />
      <View style={styles.chips}>
        {FILTERS.map(f => (
          <Chip
            key={String(f.value)}
            selected={activeFilter === f.value}
            onPress={() => onFilter(f.value)}
            style={styles.chip}
          >
            {f.label}
          </Chip>
        ))}
      </View>
      {loading ? (
        <ActivityIndicator style={styles.loader} />
      ) : people.length === 0 ? (
        <View style={styles.empty}>
          <Text variant="bodyMedium" style={styles.emptyText}>No people yet. Tap + to add someone.</Text>
        </View>
      ) : (
        <FlatList
          data={people}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <List.Item
              title={item.name}
              description={
                RELATIONSHIP_LABELS[item.relationshipType] +
                ' · ' +
                PRIORITY_LABELS[item.priority]
              }
              onPress={() => navigation.navigate('PersonDetail', { personId: item.id })}
              right={props => <List.Icon {...props} icon="chevron-right" />}
            />
          )}
        />
      )}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('AddEditPerson', {})}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  search: { margin: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, marginBottom: 4 },
  chip: { marginRight: 8, marginBottom: 8 },
  loader: { flex: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { opacity: 0.5 },
  fab: { position: 'absolute', right: 16, bottom: 16 },
});
