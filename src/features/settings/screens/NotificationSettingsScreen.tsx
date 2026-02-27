import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Switch, Divider, TextInput, Button, ActivityIndicator } from 'react-native-paper';
import { useSettingsStore } from '../store/settingsStore';

export default function NotificationSettingsScreen() {
  const { config, loading, loadConfig, updateConfig } = useSettingsStore();
  const [timeInput, setTimeInput] = useState('');
  const [timeError, setTimeError] = useState('');

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  useEffect(() => {
    if (config) setTimeInput(config.dailyNotifTime);
  }, [config]);

  function validateTime(val: string): boolean {
    return /^([01]\d|2[0-3]):([0-5]\d)$/.test(val);
  }

  async function saveTime() {
    if (!validateTime(timeInput)) {
      setTimeError('Use HH:MM format (e.g. 09:00)');
      return;
    }
    setTimeError('');
    await updateConfig({ dailyNotifTime: timeInput });
  }

  if (loading || !config) {
    return <ActivityIndicator style={styles.loader} />;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.row}>
        <Text variant="bodyLarge" style={styles.label}>Daily Summary</Text>
        <Switch
          value={config.dailyNotifEnabled}
          onValueChange={v => updateConfig({ dailyNotifEnabled: v })}
        />
      </View>

      {config.dailyNotifEnabled && (
        <View style={styles.timeRow}>
          <TextInput
            label="Daily notification time (HH:MM)"
            value={timeInput}
            onChangeText={t => { setTimeInput(t); setTimeError(''); }}
            style={styles.timeInput}
            mode="outlined"
            keyboardType="numeric"
            maxLength={5}
            error={!!timeError}
          />
          <Button mode="contained" onPress={saveTime} style={styles.saveBtn}>Set</Button>
          {!!timeError && <Text style={styles.error}>{timeError}</Text>}
        </View>
      )}

      <Divider />

      <View style={styles.row}>
        <Text variant="bodyLarge" style={styles.label}>Birthday Reminders</Text>
        <Switch
          value={config.birthdayNotifEnabled}
          onValueChange={v => updateConfig({ birthdayNotifEnabled: v })}
        />
      </View>

      <Divider />

      <View style={styles.row}>
        <Text variant="bodyLarge" style={styles.label}>Task Reminders</Text>
        <Switch
          value={config.taskNotifEnabled}
          onValueChange={v => updateConfig({ taskNotifEnabled: v })}
        />
      </View>

      <Divider />

      <View style={styles.row}>
        <Text variant="bodyLarge" style={styles.label}>Reminder Alerts</Text>
        <Switch
          value={config.reminderNotifEnabled}
          onValueChange={v => updateConfig({ reminderNotifEnabled: v })}
        />
      </View>

      <Divider />

      <View style={styles.row}>
        <Text variant="bodyLarge" style={styles.label}>Missed Item Re-reminders</Text>
        <Switch
          value={config.missedNotifEnabled}
          onValueChange={v => updateConfig({ missedNotifEnabled: v })}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  loader: { flex: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  label: { flex: 1 },
  timeRow: { paddingBottom: 12 },
  timeInput: { marginBottom: 8 },
  saveBtn: { alignSelf: 'flex-end' },
  error: { color: '#c62828', fontSize: 12, marginTop: 4 },
});
