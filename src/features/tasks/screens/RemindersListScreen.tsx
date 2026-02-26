import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { RemindersListScreenProps } from '../../../app/navigation/types';

export default function RemindersListScreen(_props: RemindersListScreenProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>RemindersListScreen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 18 },
});
