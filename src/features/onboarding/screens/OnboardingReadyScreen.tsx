import React from 'react';
import { View, StyleSheet, BackHandler, Platform } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { storage } from '../../../core/storage/mmkv';

export default function OnboardingReadyScreen() {
  const name = storage.getString('user_name') ?? 'there';

  function handleStart() {
    storage.set('onboarding_done', true);
    if (Platform.OS === 'android') {
      BackHandler.exitApp();
    }
  }

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        {"You're all set, " + name + '!'}
      </Text>
      <Text variant="bodyMedium" style={styles.body}>
        BuddyAi is ready. Reopen the app to download the AI model and get started.
      </Text>
      <Button mode="contained" onPress={handleStart} style={styles.button}>
        Close & Continue
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 32 },
  title: { marginBottom: 12 },
  body: { marginBottom: 40, lineHeight: 22 },
  button: { width: '100%' },
});
