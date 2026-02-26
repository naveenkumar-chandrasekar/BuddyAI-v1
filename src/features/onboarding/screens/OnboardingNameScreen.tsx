import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function OnboardingNameScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>OnboardingNameScreen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 18 },
});
