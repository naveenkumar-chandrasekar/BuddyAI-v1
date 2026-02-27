import React from 'react';
import { View, StyleSheet, PermissionsAndroid, Platform } from 'react-native';
import { Button, Text } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../../app/navigation/types';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'OnboardingPermission'>;

async function requestNotificationPermission(): Promise<void> {
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
  }
}

export default function OnboardingPermissionScreen({ navigation }: Props) {
  async function handleAllow() {
    await requestNotificationPermission();
    navigation.navigate('OnboardingReady');
  }

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>Enable notifications</Text>
      <Text variant="bodyMedium" style={styles.body}>
        BuddyAi needs notification permission to send your daily summary and remind you of tasks and birthdays.
      </Text>
      <Button mode="contained" onPress={handleAllow} style={styles.button}>
        Allow Notifications
      </Button>
      <Button
        mode="text"
        onPress={() => navigation.navigate('OnboardingReady')}
        style={styles.skip}
      >
        Skip for now
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 32 },
  title: { marginBottom: 12 },
  body: { marginBottom: 40, lineHeight: 22 },
  button: { width: '100%', marginBottom: 12 },
  skip: { width: '100%' },
});
