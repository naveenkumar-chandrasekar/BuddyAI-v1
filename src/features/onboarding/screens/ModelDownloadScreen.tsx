import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, ProgressBar, Surface } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../app/navigation/types';
import { downloadModel, formatBytes } from '../../../core/ai/ModelDownloadService';

type Props = NativeStackScreenProps<RootStackParamList, 'ModelDownload'>;

export default function ModelDownloadScreen({ navigation }: Props) {
  const [status, setStatus] = useState<'idle' | 'downloading' | 'error'>('idle');
  const [percent, setPercent] = useState(0);
  const [written, setWritten] = useState(0);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(async () => {
    setStatus('downloading');
    setError(null);
    try {
      await downloadModel((p, bytesWritten, contentLength) => {
        setPercent(p);
        setWritten(bytesWritten);
        setTotal(contentLength);
      });
      navigation.replace('Main');
    } catch (e) {
      setStatus('error');
      setError(e instanceof Error ? e.message : 'Download failed');
    }
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Surface style={styles.card} elevation={2}>
        <Text variant="headlineSmall" style={styles.title}>
          AI Model Required
        </Text>
        <Text variant="bodyMedium" style={styles.body}>
          BuddyAI uses Llama 3.2 1B running entirely on your device. No data ever leaves your
          phone.
        </Text>
        <Text variant="bodySmall" style={styles.size}>
          Download size: ~800 MB — connect to Wi-Fi recommended
        </Text>

        {status === 'downloading' && (
          <View style={styles.progress}>
            <ProgressBar progress={percent / 100} style={styles.bar} />
            <Text variant="bodySmall" style={styles.progressText}>
              {percent}% — {formatBytes(written)} / {total > 0 ? formatBytes(total) : '~800 MB'}
            </Text>
          </View>
        )}

        {status === 'error' && (
          <Text variant="bodySmall" style={styles.errorText}>
            {error}
          </Text>
        )}

        <Button
          mode="contained"
          onPress={start}
          disabled={status === 'downloading'}
          loading={status === 'downloading'}
          style={styles.button}
        >
          {status === 'error' ? 'Retry Download' : 'Download Model'}
        </Button>
      </Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  card: { borderRadius: 12, padding: 24, gap: 16 },
  title: { fontWeight: 'bold' },
  body: { lineHeight: 22 },
  size: { opacity: 0.6 },
  progress: { gap: 8 },
  bar: { height: 8, borderRadius: 4 },
  progressText: { textAlign: 'center', opacity: 0.7 },
  errorText: { color: 'red' },
  button: { marginTop: 8 },
});
