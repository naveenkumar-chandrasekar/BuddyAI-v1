import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { ChatScreenProps } from '../../../app/navigation/types';

export default function ChatScreen(_props: ChatScreenProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>ChatScreen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 18 },
});
