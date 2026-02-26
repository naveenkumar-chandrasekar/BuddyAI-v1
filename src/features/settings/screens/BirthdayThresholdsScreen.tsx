import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function BirthdayThresholdsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>BirthdayThresholdsScreen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 18 },
});
