import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { ChatHistoryScreenProps } from '../../../app/navigation/types';

export default function ChatHistoryScreen(_props: ChatHistoryScreenProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>ChatHistoryScreen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 18 },
});
