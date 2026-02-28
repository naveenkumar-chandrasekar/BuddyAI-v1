import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Text, List, FAB, ActivityIndicator, Divider, Card, Button } from 'react-native-paper';
import type { ChatHistoryScreenProps } from '../../../app/navigation/types';
import { useChatStore } from '../store/chatStore';
import { createNewSession } from '../../../domain/usecases/chat/GetChatSessionsUseCase';
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

const TODAY = new Date().toISOString().split('T')[0];
const TODAY_LABEL = new Date().toLocaleDateString('en-US', {
  weekday: 'long', month: 'long', day: 'numeric',
});

export default function ChatHistoryScreen({ navigation }: ChatHistoryScreenProps) {
  const { sessions, loading, loadSessions } = useChatStore();
  const [creating, setCreating] = useState(false);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  const pastSessions = sessions.filter(s => !s.isDaily || s.sessionDate !== TODAY);
  const rows = buildRows(pastSessions);

  async function handleNewChat() {
    setCreating(true);
    try {
      const session = await createNewSession();
      navigation.navigate('Chat', { sessionId: session.id });
    } finally {
      setCreating(false);
    }
  }

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator style={styles.loader} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item, i) =>
            item.type === 'header' ? `h-${item.month}` : `s-${item.session.id}-${i}`
          }
          ListHeaderComponent={
            <Card style={styles.todayCard} mode="elevated">
              <Card.Content style={styles.todayContent}>
                <View>
                  <Text variant="titleMedium" style={styles.todayTitle}>Today's Chat</Text>
                  <Text variant="bodySmall" style={styles.todayDate}>{TODAY_LABEL}</Text>
                </View>
                <Button
                  mode="contained"
                  compact
                  onPress={() => navigation.navigate('Chat', { openToday: true })}
                  style={styles.todayBtn}
                >
                  Open
                </Button>
              </Card.Content>
            </Card>
          }
          ListEmptyComponent={
            pastSessions.length === 0 ? (
              <View style={styles.empty}>
                <Text variant="bodyMedium" style={styles.emptyText}>
                  No past chats. Tap + to start a new one.
                </Text>
              </View>
            ) : null
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
        label="New Chat"
        style={styles.fab}
        loading={creating}
        onPress={handleNewChat}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { flex: 1 },
  todayCard: { margin: 12, marginBottom: 4 },
  todayContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  todayTitle: { fontWeight: 'bold' },
  todayDate: { opacity: 0.6, marginTop: 2 },
  todayBtn: { marginLeft: 8 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48 },
  emptyText: { opacity: 0.5 },
  monthHeader: { paddingHorizontal: 16, paddingVertical: 8, opacity: 0.6 },
  fab: { position: 'absolute', right: 16, bottom: 16 },
});
