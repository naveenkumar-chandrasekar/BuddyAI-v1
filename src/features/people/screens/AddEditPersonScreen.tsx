import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Button, Text, TextInput, SegmentedButtons, Menu } from 'react-native-paper';
import type { AddEditPersonScreenProps } from '../../../app/navigation/types';
import { usePeopleStore } from '../store/peopleStore';
import { Priority, PRIORITY_LABELS } from '../../../shared/constants/priority';
import { RelationshipType, RELATIONSHIP_LABELS } from '../../../shared/constants/relationships';
import { PlaceType } from '../../../shared/constants/places';
import type { PriorityValue } from '../../../shared/constants/priority';
import type { RelationshipTypeValue } from '../../../shared/constants/relationships';

export default function AddEditPersonScreen({ navigation, route }: AddEditPersonScreenProps) {
  const { personId } = route.params ?? {};
  const { people, places, loadPlaces, addPerson, updatePerson, addPlace } = usePeopleStore();
  const existing = personId ? people.find(p => p.id === personId) : undefined;

  const [name, setName] = useState(existing?.name ?? '');
  const [relation, setRelation] = useState<RelationshipTypeValue>(existing?.relationshipType ?? RelationshipType.FAMILY);
  const [customRelation, setCustomRelation] = useState(existing?.customRelation ?? '');
  const [priority, setPriority] = useState<PriorityValue>(existing?.priority ?? Priority.MEDIUM);
  const [birthday, setBirthday] = useState(existing?.birthday ?? '');
  const [phone, setPhone] = useState(existing?.phone ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [placeId, setPlaceId] = useState<string | undefined>(existing?.placeId ?? undefined);
  const [placeMenuVisible, setPlaceMenuVisible] = useState(false);
  const [newPlaceName, setNewPlaceName] = useState('');
  const [newPlaceType] = useState<string>(PlaceType.OFFICE);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadPlaces(); }, [loadPlaces]);

  async function handleSave() {
    if (!name.trim()) { Alert.alert('Name is required'); return; }
    setSaving(true);
    try {
      const input = {
        name: name.trim(),
        relationshipType: relation,
        customRelation: relation === RelationshipType.CUSTOM ? customRelation : undefined,
        placeId,
        priority,
        birthday: birthday || undefined,
        phone: phone || undefined,
        notes: notes || undefined,
      };
      if (personId) {
        await updatePerson(personId, input);
      } else {
        await addPerson(input);
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', String(e));
    } finally {
      setSaving(false);
    }
  }

  async function handleAddPlace() {
    if (!newPlaceName.trim()) return;
    const place = await addPlace({ name: newPlaceName.trim(), type: newPlaceType as never });
    setPlaceId(place.id);
    setNewPlaceName('');
  }

  const priorityButtons = [
    { value: String(Priority.HIGH), label: PRIORITY_LABELS[Priority.HIGH] },
    { value: String(Priority.MEDIUM), label: PRIORITY_LABELS[Priority.MEDIUM] },
    { value: String(Priority.LOW), label: PRIORITY_LABELS[Priority.LOW] },
  ];

  const selectedPlace = places.find(p => p.id === placeId);

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text variant="titleMedium" style={styles.section}>Name</Text>
      <TextInput label="Full name" value={name} onChangeText={setName} mode="outlined" style={styles.input} />

      <Text variant="titleMedium" style={styles.section}>Relationship</Text>
      <View style={styles.chipRow}>
        {Object.values(RelationshipType).map(r => (
          <Button
            key={r}
            mode={relation === r ? 'contained' : 'outlined'}
            compact
            onPress={() => setRelation(r)}
            style={styles.relBtn}
          >
            {RELATIONSHIP_LABELS[r]}
          </Button>
        ))}
      </View>
      {relation === RelationshipType.CUSTOM && (
        <TextInput label="Custom relation" value={customRelation} onChangeText={setCustomRelation} mode="outlined" style={styles.input} />
      )}

      <Text variant="titleMedium" style={styles.section}>Priority</Text>
      <SegmentedButtons
        value={String(priority)}
        onValueChange={v => setPriority(Number(v) as PriorityValue)}
        buttons={priorityButtons}
        style={styles.segmented}
      />

      <Text variant="titleMedium" style={styles.section}>Place (optional)</Text>
      <Menu
        visible={placeMenuVisible}
        onDismiss={() => setPlaceMenuVisible(false)}
        anchor={
          <Button mode="outlined" onPress={() => setPlaceMenuVisible(true)} style={styles.input}>
            {selectedPlace ? selectedPlace.name : 'Select place'}
          </Button>
        }
      >
        <Menu.Item title="None" onPress={() => { setPlaceId(undefined); setPlaceMenuVisible(false); }} />
        {places.map(p => (
          <Menu.Item key={p.id} title={p.name} onPress={() => { setPlaceId(p.id); setPlaceMenuVisible(false); }} />
        ))}
      </Menu>
      <View style={styles.newPlace}>
        <TextInput label="New place name" value={newPlaceName} onChangeText={setNewPlaceName} mode="outlined" style={styles.newPlaceInput} dense />
        <Button mode="outlined" compact onPress={handleAddPlace} disabled={!newPlaceName.trim()}>Add</Button>
      </View>

      <Text variant="titleMedium" style={styles.section}>Details (optional)</Text>
      <TextInput label="Birthday (YYYY-MM-DD)" value={birthday} onChangeText={setBirthday} mode="outlined" style={styles.input} />
      <TextInput label="Phone" value={phone} onChangeText={setPhone} mode="outlined" style={styles.input} keyboardType="phone-pad" />
      <TextInput label="Notes" value={notes} onChangeText={setNotes} mode="outlined" style={styles.input} multiline numberOfLines={3} />

      <Button mode="contained" onPress={handleSave} loading={saving} disabled={saving} style={styles.save}>
        {personId ? 'Save changes' : 'Add person'}
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  section: { marginTop: 20, marginBottom: 8 },
  input: { marginBottom: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  relBtn: { marginBottom: 4 },
  segmented: { marginBottom: 8 },
  newPlace: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 8 },
  newPlaceInput: { flex: 1 },
  save: { marginTop: 24, marginBottom: 40 },
});
