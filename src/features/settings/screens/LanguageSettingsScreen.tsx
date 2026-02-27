import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, List, Switch, Divider } from 'react-native-paper';
import { useSettingsStore } from '../store/settingsStore';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'ja', label: '日本語' },
  { code: 'ar', label: 'العربية' },
  { code: 'pt', label: 'Português' },
];

export default function LanguageSettingsScreen() {
  const { language, autoDetectLanguage, setLanguage, setAutoDetectLanguage } = useSettingsStore();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.row}>
        <View style={styles.labelBlock}>
          <Text variant="bodyLarge">Auto-detect language</Text>
          <Text variant="bodySmall" style={styles.sub}>
            Chatbot responds in the language you write in
          </Text>
        </View>
        <Switch
          value={autoDetectLanguage}
          onValueChange={setAutoDetectLanguage}
        />
      </View>

      <Divider />

      {!autoDetectLanguage && (
        <>
          <Text variant="labelLarge" style={styles.sectionTitle}>Select language</Text>
          {LANGUAGES.map(lang => (
            <List.Item
              key={lang.code}
              title={lang.label}
              onPress={() => setLanguage(lang.code)}
              right={props =>
                language === lang.code ? (
                  <List.Icon {...props} icon="check" />
                ) : null
              }
            />
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  labelBlock: { flex: 1, paddingRight: 8 },
  sub: { opacity: 0.6, marginTop: 2 },
  sectionTitle: { paddingTop: 16, paddingBottom: 8, opacity: 0.6 },
});
