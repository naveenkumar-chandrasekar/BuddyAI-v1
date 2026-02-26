import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { TasksListScreenProps } from '../../../app/navigation/types';

export default function TasksListScreen(_props: TasksListScreenProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>TasksListScreen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 18 },
});
