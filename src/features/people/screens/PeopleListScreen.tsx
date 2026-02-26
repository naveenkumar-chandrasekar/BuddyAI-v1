import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { PeopleListScreenProps } from '../../../app/navigation/types';

export default function PeopleListScreen(_props: PeopleListScreenProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>PeopleListScreen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 18 },
});
