import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { TodosListScreenProps } from '../../../app/navigation/types';

export default function TodosListScreen(_props: TodosListScreenProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>TodosListScreen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 18 },
});
