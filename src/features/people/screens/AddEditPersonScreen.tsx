import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert, TouchableOpacity, Platform } from 'react-native';
import { Button, Text, TextInput, SegmentedButtons, Chip } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { AddEditPersonScreenProps } from '../../../app/navigation/types';
import { usePeopleStore } from '../store/peopleStore';
import { Priority, PRIORITY_LABELS } from '../../../shared/constants/priority';
import { RelationshipType, RELATIONSHIP_LABELS } from '../../../shared/constants/relationships';
import type { PriorityValue } from '../../../shared/constants/priority';
import type { RelationshipTypeValue } from '../../../shared/constants/relationships';

const RELATION_COLORS: Record<string, string> = {
  family: '#E53935',
  college: '#8E24AA',
  school: '#1E88E5',
  office: '#43A047',
  other: '#FB8C00',
  custom: '#00ACC1',
};

const RELATION_ICONS: Record<string, string> = {
  family: '👨‍👩‍👧',
  college: '🎓',
  school: '🏫',
  office: '💼',
  other: '🤝',
  custom: '✏️',
};

function avatarColor(name: string): string {
  if (!name) return '#5B3EBF';
  const palette = ['#5B3EBF', '#E53935', '#1E88E5', '#43A047', '#FB8C00', '#8E24AA', '#00ACC1', '#F4511E'];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + h * 31;
  return palette[Math.abs(h) % palette.length];
}

function initials(name: string): string {
  return name.split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase() || '?';
}

function formatBirthday(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function dateToBirthdayString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function AddEditPersonScreen({ navigation, route }: AddEditPersonScreenProps) {
  const { personId } = route.params ?? {};
  const { people, addPerson, updatePerson } = usePeopleStore();
  const existing = personId ? people.find(p => p.id === personId) : undefined;

  const [name, setName] = useState(existing?.name ?? '');
  const [relation, setRelation] = useState<RelationshipTypeValue>(existing?.relationshipType ?? RelationshipType.FAMILY);
  const [customRelation, setCustomRelation] = useState(existing?.customRelation ?? '');
  const [priority, setPriority] = useState<PriorityValue>(existing?.priority ?? Priority.MEDIUM);
  const [phone, setPhone] = useState(existing?.phone ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');

  const parsedBirthday = existing?.birthday
    ? (() => { const [y, m, d] = existing.birthday!.split('-').map(Number); return new Date(y, m - 1, d); })()
    : null;
  const [hasBirthday, setHasBirthday] = useState(!!existing?.birthday);
  const [birthdayDate, setBirthdayDate] = useState<Date>(parsedBirthday ?? new Date(1990, 0, 1));
  const [showBirthdayPicker, setShowBirthdayPicker] = useState(false);

  const [saving, setSaving] = useState(false);

  function handleBirthdayChange(_: unknown, selected?: Date) {
    if (Platform.OS === 'android') setShowBirthdayPicker(false);
    if (selected) setBirthdayDate(selected);
  }

  async function handleSave() {
    if (!name.trim()) { Alert.alert('Name is required'); return; }
    setSaving(true);
    try {
      const input = {
        name: name.trim(),
        relationshipType: relation,
        customRelation: relation === RelationshipType.CUSTOM ? customRelation.trim() : undefined,
        priority,
        birthday: hasBirthday ? dateToBirthdayString(birthdayDate) : undefined,
        phone: phone.trim() || undefined,
        notes: notes.trim() || undefined,
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

  const priorityButtons = [
    { value: String(Priority.HIGH), label: PRIORITY_LABELS[Priority.HIGH] },
    { value: String(Priority.MEDIUM), label: PRIORITY_LABELS[Priority.MEDIUM] },
    { value: String(Priority.LOW), label: PRIORITY_LABELS[Priority.LOW] },
  ];

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      {/* Avatar preview */}
      <View style={styles.avatarSection}>
        <View style={[styles.avatarLarge, { backgroundColor: avatarColor(name) }]}>
          <Text style={styles.avatarLargeText}>{initials(name)}</Text>
        </View>
      </View>

      {/* Name */}
      <Text variant="titleMedium" style={styles.section}>Name *</Text>
      <TextInput
        label="Full name"
        value={name}
        onChangeText={setName}
        mode="outlined"
        style={styles.input}
        autoFocus={!personId}
      />

      {/* Relationship group */}
      <Text variant="titleMedium" style={styles.section}>Group</Text>
      <View style={styles.relRow}>
        {Object.values(RelationshipType).map(r => {
          const color = RELATION_COLORS[r];
          const selected = relation === r;
          const chipStyle = { borderColor: color, backgroundColor: selected ? color : 'transparent' };
          const chipLabelStyle = { color: selected ? '#fff' : color };
          return (
            <TouchableOpacity
              key={r}
              onPress={() => setRelation(r)}
              style={[styles.relChip, chipStyle]}
            >
              <Text style={styles.relChipIcon}>{RELATION_ICONS[r]}</Text>
              <Text style={[styles.relChipLabel, chipLabelStyle]}>
                {RELATIONSHIP_LABELS[r]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {relation === RelationshipType.CUSTOM && (
        <TextInput
          label="Custom relation label"
          value={customRelation}
          onChangeText={setCustomRelation}
          mode="outlined"
          style={styles.input}
          placeholder="e.g. Mentor, Neighbour…"
        />
      )}

      {/* Priority */}
      <Text variant="titleMedium" style={styles.section}>Priority</Text>
      <SegmentedButtons
        value={String(priority)}
        onValueChange={v => setPriority(Number(v) as PriorityValue)}
        buttons={priorityButtons}
        style={styles.segmented}
      />

      {/* Phone */}
      <Text variant="titleMedium" style={styles.section}>Phone (optional)</Text>
      <TextInput
        label="Phone number"
        value={phone}
        onChangeText={setPhone}
        mode="outlined"
        style={styles.input}
        keyboardType="phone-pad"
      />

      {/* Birthday */}
      <View style={styles.birthdayHeader}>
        <Text variant="titleMedium">Birthday (optional)</Text>
        <Chip selected={hasBirthday} onPress={() => setHasBirthday(v => !v)} compact>
          {hasBirthday ? 'Set' : 'None'}
        </Chip>
      </View>

      {hasBirthday && (
        Platform.OS === 'ios' ? (
          <DateTimePicker
            value={birthdayDate}
            mode="date"
            display="spinner"
            onChange={handleBirthdayChange}
            maximumDate={new Date()}
            style={styles.iosPicker}
          />
        ) : (
          <>
            <TouchableOpacity style={styles.dateBtn} onPress={() => setShowBirthdayPicker(true)}>
              <Text variant="bodyLarge" style={styles.dateBtnText}>{formatBirthday(birthdayDate)}</Text>
            </TouchableOpacity>
            {showBirthdayPicker && (
              <DateTimePicker
                value={birthdayDate}
                mode="date"
                display="default"
                onChange={handleBirthdayChange}
                maximumDate={new Date()}
              />
            )}
          </>
        )
      )}

      {/* Notes */}
      <Text variant="titleMedium" style={styles.section}>Notes (optional)</Text>
      <TextInput
        label="Notes"
        value={notes}
        onChangeText={setNotes}
        mode="outlined"
        style={styles.input}
        multiline
        numberOfLines={3}
      />

      <Button
        mode="contained"
        onPress={handleSave}
        loading={saving}
        disabled={saving}
        style={styles.save}
      >
        {personId ? 'Save changes' : 'Add person'}
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  avatarSection: { alignItems: 'center', paddingVertical: 20 },
  avatarLarge: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  avatarLargeText: { color: '#fff', fontWeight: '700', fontSize: 30 },
  section: { marginTop: 20, marginBottom: 8 },
  input: { marginBottom: 8 },
  segmented: { marginBottom: 8 },
  relRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  relChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  relChipIcon: { fontSize: 14 },
  relChipLabel: { fontSize: 13, fontWeight: '600' },
  birthdayHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, marginBottom: 8 },
  iosPicker: { marginBottom: 8 },
  dateBtn: { backgroundColor: '#EDE5FF', borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 8 },
  dateBtnText: { color: '#5B3EBF', fontWeight: '600' },
  save: { marginTop: 24, marginBottom: 40 },
});
