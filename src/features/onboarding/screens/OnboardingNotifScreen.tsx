import React, { useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Button, Text, TouchableRipple } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../../app/navigation/types';
import { storage } from '../../../core/storage/mmkv';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'OnboardingNotif'>;

function timeToDate(hhmm: string): Date {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

function dateToHHMM(d: Date): string {
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

function formatDisplay(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

export default function OnboardingNotifScreen({ navigation }: Props) {
  const [time, setTime] = useState('08:00');
  const [showPicker, setShowPicker] = useState(Platform.OS === 'ios');

  function handleChange(_: unknown, selected?: Date) {
    if (Platform.OS === 'android') setShowPicker(false);
    if (selected) setTime(dateToHHMM(selected));
  }

  function handleNext() {
    storage.set('daily_notif_time', time);
    navigation.navigate('OnboardingPermission');
  }

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>Daily summary time</Text>
      <Text variant="bodyMedium" style={styles.body}>
        I'll send you a personalised briefing each morning. When should I send it?
      </Text>

      {Platform.OS === 'android' && (
        <TouchableRipple onPress={() => setShowPicker(true)} style={styles.timeButton}>
          <Text variant="displaySmall" style={styles.timeText}>{formatDisplay(time)}</Text>
        </TouchableRipple>
      )}

      {showPicker && (
        <DateTimePicker
          value={timeToDate(time)}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
          style={styles.picker}
        />
      )}

      <Button mode="contained" onPress={handleNext} style={styles.cta}>
        Continue
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 32 },
  title: { marginBottom: 12 },
  body: { marginBottom: 32, lineHeight: 22 },
  timeButton: { alignSelf: 'center', marginBottom: 40, borderRadius: 12, padding: 16 },
  timeText: { color: '#5C33D4', fontWeight: 'bold' },
  picker: { marginBottom: 40, alignSelf: 'center' },
  cta: { width: '100%' },
});
