import React, { useState } from 'react';
import { View, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../../app/navigation/types';
import { storage } from '../../../core/storage/mmkv';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'OnboardingProfile'>;

export default function OnboardingProfileScreen({ navigation }: Props) {
  const name = storage.getString('user_name') ?? 'You';
  const [phone, setPhone] = useState('');
  const [birthday, setBirthday] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  function formatBirthday(d: Date): string {
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }

  function handleDateChange(_: unknown, selected?: Date) {
    if (Platform.OS === 'android') setShowPicker(false);
    if (selected) setBirthday(selected);
  }

  function handleNext() {
    if (phone.trim()) storage.set('user_phone', phone.trim());
    if (birthday) {
      const y = birthday.getFullYear();
      const m = String(birthday.getMonth() + 1).padStart(2, '0');
      const d = String(birthday.getDate()).padStart(2, '0');
      storage.set('user_birthday', `${y}-${m}-${d}`);
    }
    navigation.navigate('OnboardingNotif');
  }

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        A bit about you, {name}
      </Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        This creates your profile in BuddyAi so people can be linked to you.
      </Text>

      <Text variant="labelLarge" style={styles.label}>Phone number (optional)</Text>
      <TextInput
        label="Phone"
        value={phone}
        onChangeText={setPhone}
        mode="outlined"
        keyboardType="phone-pad"
        style={styles.input}
        placeholder="+1 555 000 0000"
      />

      <Text variant="labelLarge" style={styles.label}>Birthday (optional)</Text>
      <TouchableOpacity
        style={styles.dateTouchable}
        onPress={() => setShowPicker(true)}
        activeOpacity={0.7}
      >
        <Text variant="bodyLarge" style={birthday ? styles.dateText : styles.datePlaceholder}>
          {birthday ? formatBirthday(birthday) : 'Tap to set birthday'}
        </Text>
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={birthday ?? new Date(1990, 0, 1)}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          maximumDate={new Date()}
          onChange={handleDateChange}
        />
      )}

      {Platform.OS === 'ios' && showPicker && (
        <Button onPress={() => setShowPicker(false)} style={styles.doneBtn}>Done</Button>
      )}

      <Button
        mode="contained"
        onPress={handleNext}
        style={styles.button}
      >
        Continue
      </Button>
      <Button mode="text" onPress={handleNext} style={styles.skipBtn}>
        Skip for now
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 32 },
  title: { marginBottom: 8 },
  subtitle: { marginBottom: 32, color: '#666' },
  label: { marginBottom: 6, color: '#333' },
  input: { marginBottom: 24 },
  dateTouchable: {
    borderWidth: 1, borderColor: '#999', borderRadius: 6,
    paddingVertical: 14, paddingHorizontal: 14, marginBottom: 32,
  },
  dateText: { color: '#111' },
  datePlaceholder: { color: '#999' },
  button: { width: '100%', marginBottom: 8 },
  doneBtn: { marginBottom: 8 },
  skipBtn: { width: '100%' },
});
