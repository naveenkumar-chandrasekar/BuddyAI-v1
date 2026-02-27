import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Divider, ActivityIndicator } from 'react-native-paper';
import {
  getCurrentUser,
  signInWithGoogle,
  signOut,
  onAuthStateChanged,
  configureGoogleSignIn,
  type AppUser,
} from '../../../data/firebase/FirebaseAuth';
import { syncToFirebase, getLastSyncTime } from '../../../domain/usecases/sync/SyncUseCase';

function formatSyncTime(ts: number | null): string {
  if (ts === null) return 'Never';
  return new Date(ts).toLocaleString();
}

export default function SyncSettingsScreen() {
  const [user, setUser] = useState<AppUser | null>(getCurrentUser());
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<number | null>(getLastSyncTime());
  const [status, setStatus] = useState<string>('');

  useEffect(() => {
    configureGoogleSignIn();
    const unsub = onAuthStateChanged(u => setUser(u));
    return unsub;
  }, []);

  async function handleSignIn() {
    try {
      const u = await signInWithGoogle();
      setUser(u);
      setStatus('');
    } catch (e) {
      setStatus(`Sign-in failed: ${String(e)}`);
    }
  }

  async function handleSignOut() {
    await signOut();
    setUser(null);
    setStatus('');
  }

  async function handleSync() {
    setSyncing(true);
    setStatus('');
    const result = await syncToFirebase();
    setSyncing(false);
    if (result.success) {
      const ts = getLastSyncTime();
      setLastSync(ts);
      setStatus('Sync complete');
    } else {
      setStatus(`Sync failed: ${result.error ?? 'Unknown error'}`);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>Firebase Backup</Text>
        {user ? (
          <>
            <Text variant="bodyMedium" style={styles.email}>
              {user.email ?? user.displayName ?? user.uid}
            </Text>
            <Button mode="outlined" onPress={handleSignOut} style={styles.button}>
              Sign Out
            </Button>
          </>
        ) : (
          <Button mode="contained" onPress={handleSignIn} style={styles.button}>
            Sign in with Google
          </Button>
        )}
      </View>

      <Divider />

      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>Sync</Text>
        <Text variant="bodySmall" style={styles.lastSync}>
          Last synced: {formatSyncTime(lastSync)}
        </Text>
        {syncing ? (
          <ActivityIndicator style={styles.button} />
        ) : (
          <Button
            mode="contained"
            onPress={handleSync}
            disabled={!user}
            style={styles.button}
          >
            Sync Now
          </Button>
        )}
        {status !== '' && (
          <Text
            variant="bodySmall"
            style={status.startsWith('Sync complete') ? styles.success : styles.error}
          >
            {status}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  section: { paddingVertical: 16 },
  sectionTitle: { marginBottom: 12 },
  email: { marginBottom: 8, opacity: 0.7 },
  button: { alignSelf: 'flex-start', marginTop: 8 },
  lastSync: { opacity: 0.6, marginBottom: 8 },
  success: { color: '#2e7d32', marginTop: 8 },
  error: { color: '#c62828', marginTop: 8 },
});
