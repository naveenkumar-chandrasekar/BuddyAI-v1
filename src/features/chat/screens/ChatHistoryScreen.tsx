import React, { useEffect } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Text, List, FAB, ActivityIndicator, Divider } from 'react-native-paper';
import type { ChatHistoryScreenProps } from '../../../app/navigation/types';
import { useChatStore } from '../store/chatStore';
import type { ChatSession } from '../../../domain/models/Chat';

type ListRow =
  | { type: 'header'; month: string }
  | { type: 'session'; session: ChatSession };

function buildRows(sessions: ChatSession[]): ListRow[] {
  const groups: Record<string, ChatSession[]> = {};
  for (const s of sessions) {
    const month = s.sessionDate.slice(0, 7);
    if (!groups[month]) groups[month] = [];
    groups[month].push(s);
  }
  const rows: ListRow[] = [];
  for (const month of Object.keys(groups).sort().reverse()) {
    rows.push({ type: 'header', month });
    for (const s of groups[month]) rows.push({ type: 'session', session: s });
  }
  return rows;
}

export default function ChatHistoryScreen({ navigation }: ChatHistoryScreenProps) {
  const { sessions, loading, loadSessions } = useChatStore();

  useEffect(() => { loadSessions(); }, [loadSessions]);

  const rows = buildRows(sessions);

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator style={styles.loader} />
      ) : sessions.length === 0 ? (
        <View style={styles.empty}>
          <Text variant="bodyMedium" style={styles.emptyText}>
            No chats yet. Tap + to start.
          </Text>
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item, i) =>
            item.type === 'header' ? `h-${item.month}` : `s-${item.session.id}-${i}`
          }
          renderItem={({ item }) => {
            if (item.type === 'header') {
              return (
                <>
                  <Text variant="labelMedium" style={styles.monthHeader}>
                    {new Date(item.month + '-01').toLocaleDateString('en-US', {
                      month: 'long', year: 'numeric',
                    })}
                  </Text>
                  <Divider />
                </>
              );
            }
            const { session } = item;
            return (
              <List.Item
                title={session.title ?? session.sessionDate}
                description={session.summary?.slice(0, 60) ?? (session.isDaily ? 'Daily chat' : 'Chat session')}
                left={props => (
                  <List.Icon {...props} icon={session.isDaily ? 'calendar-today' : 'chat-outline'} />
                )}
                onPress={() => navigation.navigate('Chat', { sessionId: session.id })}
              />
            );
          }}
        />
      )}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('Chat', { openToday: true })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { flex: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { opacity: 0.5 },
  monthHeader: { paddingHorizontal: 16, paddingVertical: 8, opacity: 0.6 },
  fab: { position: 'absolute', right: 16, bottom: 16 },
});
