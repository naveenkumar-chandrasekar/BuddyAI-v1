import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { AddEditPersonScreenProps } from '../../../app/navigation/types';

export default function AddEditPersonScreen(_props: AddEditPersonScreenProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>AddEditPersonScreen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 18 },
});
