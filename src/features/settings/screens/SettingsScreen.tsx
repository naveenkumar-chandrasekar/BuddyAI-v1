import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { List, TextInput, Button, Divider } from 'react-native-paper';
import type { SettingsScreenProps } from '../../../app/navigation/types';
import { storage } from '../../../core/storage/mmkv';

const USER_NAME_KEY = 'user_name';

export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  const [name, setName] = useState(storage.getString(USER_NAME_KEY) ?? '');
  const [saved, setSaved] = useState(false);

  function saveName() {
    storage.set(USER_NAME_KEY, name.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.nameSection}>
        <TextInput
          label="Your name"
          value={name}
          onChangeText={text => { setName(text); setSaved(false); }}
          style={styles.input}
          mode="outlined"
        />
        <Button
          mode="contained"
          onPress={saveName}
          disabled={!name.trim()}
          style={styles.saveBtn}
        >
          {saved ? 'Saved!' : 'Save'}
        </Button>
      </View>

      <Divider />

      <List.Section>
        <List.Subheader>Preferences</List.Subheader>
        <List.Item
          title="Notifications"
          left={props => <List.Icon {...props} icon="bell-outline" />}
          right={props => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => navigation.navigate('NotificationSettings')}
        />
        <List.Item
          title="Birthday Thresholds"
          left={props => <List.Icon {...props} icon="cake-variant-outline" />}
          right={props => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => navigation.navigate('BirthdayThresholds')}
        />
        <List.Item
          title="Language"
          left={props => <List.Icon {...props} icon="translate" />}
          right={props => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => navigation.navigate('LanguageSettings')}
        />
        <List.Item
          title="Backup & Sync"
          left={props => <List.Icon {...props} icon="cloud-sync-outline" />}
          right={props => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => navigation.navigate('SyncSettings')}
        />
      </List.Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  nameSection: { padding: 16 },
  input: { marginBottom: 8 },
  saveBtn: { alignSelf: 'flex-end' },
});
