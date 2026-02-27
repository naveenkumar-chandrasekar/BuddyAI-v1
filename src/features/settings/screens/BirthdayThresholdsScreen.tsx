import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, IconButton, Divider, ActivityIndicator } from 'react-native-paper';
import { useSettingsStore } from '../store/settingsStore';

function StepperRow({
  label,
  value,
  onDecrement,
  onIncrement,
  min = 1,
  max = 60,
}: {
  label: string;
  value: number;
  onDecrement: () => void;
  onIncrement: () => void;
  min?: number;
  max?: number;
}) {
  return (
    <View style={styles.row}>
      <Text variant="bodyLarge" style={styles.rowLabel}>{label}</Text>
      <View style={styles.stepper}>
        <IconButton icon="minus" size={20} disabled={value <= min} onPress={onDecrement} />
        <Text variant="bodyLarge" style={styles.value}>{value}</Text>
        <IconButton icon="plus" size={20} disabled={value >= max} onPress={onIncrement} />
        <Text variant="bodySmall" style={styles.unit}>days</Text>
      </View>
    </View>
  );
}

export default function BirthdayThresholdsScreen() {
  const { config, loading, loadConfig, updateConfig } = useSettingsStore();

  useEffect(() => { loadConfig(); }, [loadConfig]);

  if (loading || !config) {
    return <ActivityIndicator style={styles.loader} />;
  }

  return (
    <ScrollView style={styles.container}>
      <Text variant="bodyMedium" style={styles.description}>
        How many days before a birthday to send a reminder, based on the person's priority.
      </Text>

      <StepperRow
        label="High Priority"
        value={config.highPriorityDays}
        onDecrement={() => updateConfig({ highPriorityDays: config.highPriorityDays - 1 })}
        onIncrement={() => updateConfig({ highPriorityDays: config.highPriorityDays + 1 })}
        min={1}
      />
      <Divider />
      <StepperRow
        label="Medium Priority"
        value={config.mediumPriorityDays}
        onDecrement={() => updateConfig({ mediumPriorityDays: config.mediumPriorityDays - 1 })}
        onIncrement={() => updateConfig({ mediumPriorityDays: config.mediumPriorityDays + 1 })}
        min={1}
      />
      <Divider />
      <StepperRow
        label="Low Priority"
        value={config.lowPriorityDays}
        onDecrement={() => updateConfig({ lowPriorityDays: config.lowPriorityDays - 1 })}
        onIncrement={() => updateConfig({ lowPriorityDays: config.lowPriorityDays + 1 })}
        min={1}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  loader: { flex: 1 },
  description: { opacity: 0.6, marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  rowLabel: { flex: 1 },
  stepper: { flexDirection: 'row', alignItems: 'center' },
  value: { minWidth: 28, textAlign: 'center' },
  unit: { opacity: 0.6, marginLeft: 4 },
});
