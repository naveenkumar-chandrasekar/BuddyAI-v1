import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text, SegmentedButtons } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../../app/navigation/types';
import { storage } from '../../../core/storage/mmkv';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'OnboardingNotif'>;

const TIMES = [
  { value: '07:00', label: '7 AM' },
  { value: '08:00', label: '8 AM' },
  { value: '09:00', label: '9 AM' },
  { value: '10:00', label: '10 AM' },
];

export default function OnboardingNotifScreen({ navigation }: Props) {
  const [time, setTime] = useState('08:00');

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
      <SegmentedButtons
        value={time}
        onValueChange={setTime}
        buttons={TIMES}
        style={styles.buttons}
      />
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
  buttons: { marginBottom: 40 },
  cta: { width: '100%' },
});
