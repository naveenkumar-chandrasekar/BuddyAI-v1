import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { PersonDetailScreenProps } from '../../../app/navigation/types';

export default function PersonDetailScreen(_props: PersonDetailScreenProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>PersonDetailScreen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 18 },
});
