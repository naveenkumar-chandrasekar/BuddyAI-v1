import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function NotificationSettingsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>NotificationSettingsScreen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 18 },
});
