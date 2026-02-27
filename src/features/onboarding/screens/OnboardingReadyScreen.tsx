import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../app/navigation/types';
import { storage } from '../../../core/storage/mmkv';

export default function OnboardingReadyScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const name = storage.getString('user_name') ?? 'there';

  function handleStart() {
    storage.set('onboarding_done', true);
    navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  }

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        {"You're all set, " + name + '!'}
      </Text>
      <Text variant="bodyMedium" style={styles.body}>
        BuddyAi is ready. Start by adding people or just chat with me.
      </Text>
      <Button mode="contained" onPress={handleStart} style={styles.button}>
        Let's go
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
