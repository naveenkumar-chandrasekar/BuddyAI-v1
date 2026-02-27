import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../../../app/navigation/types';
import { storage } from '../../../core/storage/mmkv';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'OnboardingName'>;

export default function OnboardingNameScreen({ navigation }: Props) {
  const [name, setName] = useState('');

  function handleNext() {
    const trimmed = name.trim();
    if (!trimmed) return;
    storage.set('user_name', trimmed);
    navigation.navigate('OnboardingNotif');
  }

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>What should I call you?</Text>
      <TextInput
        label="Your name"
        value={name}
        onChangeText={setName}
        mode="outlined"
        autoFocus
        style={styles.input}
        returnKeyType="done"
        onSubmitEditing={handleNext}
      />
      <Button
        mode="contained"
        onPress={handleNext}
        disabled={!name.trim()}
        style={styles.button}
      >
        Continue
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 32 },
  title: { marginBottom: 32 },
  input: { marginBottom: 24 },
  button: { width: '100%' },
});
