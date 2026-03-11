import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text, ActivityIndicator } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../app/navigation/types';
import { storage } from '../../../core/storage/mmkv';
import { addPerson } from '../../../domain/usecases/people/AddPersonUseCase';
import { Priority } from '../../../shared/constants/priority';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function OnboardingReadyScreen() {
  const navigation = useNavigation<Nav>();
  const name = storage.getString('user_name') ?? 'there';
  const [loading, setLoading] = useState(false);

  async function handleStart() {
    setLoading(true);
    try {
      const selfCreated = storage.getBoolean('self_person_created');
      if (!selfCreated) {
        const phone = storage.getString('user_phone');
        const birthday = storage.getString('user_birthday');
        await addPerson({
          name,
          relationshipType: 'other' as never,
          priority: Priority.HIGH,
          phone: phone ?? undefined,
          birthday: birthday ?? undefined,
          notes: 'Primary user',
        });
        storage.set('self_person_created', true);
      }
    } catch {
      // non-fatal — proceed anyway
    }
    storage.set('onboarding_done', true);
    navigation.replace('ModelDownload');
  }

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        {"You're all set, " + name + '!'}
      </Text>
      <Text variant="bodyMedium" style={styles.body}>
        BuddyAi needs to download the AI model (~400 MB) to work. Connect to Wi-Fi and tap below.
      </Text>
      {loading ? (
        <ActivityIndicator size="large" style={styles.loader} />
      ) : (
        <Button mode="contained" onPress={handleStart} style={styles.button}>
          Download AI Model
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 32 },
  title: { marginBottom: 12 },
  body: { marginBottom: 40, lineHeight: 22 },
  button: { width: '100%' },
  loader: { marginTop: 8 },
});
