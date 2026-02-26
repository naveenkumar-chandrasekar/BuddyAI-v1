import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { SettingsScreenProps } from '../../../app/navigation/types';

export default function SettingsScreen(_props: SettingsScreenProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>SettingsScreen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 18 },
});
