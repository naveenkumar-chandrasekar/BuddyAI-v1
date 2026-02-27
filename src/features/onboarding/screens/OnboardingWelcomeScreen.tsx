import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../../app/navigation/types';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'OnboardingWelcome'>;

export default function OnboardingWelcomeScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text variant="displaySmall" style={styles.title}>BuddyAi</Text>
      <Text variant="bodyLarge" style={styles.subtitle}>
        Your smart daily companion
      </Text>
      <Text variant="bodyMedium" style={styles.body}>
        Manage your relationships, tasks, and reminders — all through a simple chat. 100% private, on your device.
      </Text>
      <Button
        mode="contained"
        onPress={() => navigation.navigate('OnboardingName')}
        style={styles.button}
      >
        Get Started
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  title: { fontWeight: 'bold', marginBottom: 8 },
  subtitle: { marginBottom: 24, opacity: 0.7 },
  body: { textAlign: 'center', marginBottom: 48, lineHeight: 24 },
  button: { width: '100%' },
});
