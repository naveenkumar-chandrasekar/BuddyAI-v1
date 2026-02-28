import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, FlatList, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Text, TextInput, IconButton, ActivityIndicator, Chip, Button } from 'react-native-paper';
import type { ChatScreenProps } from '../../../app/navigation/types';
import { useChatStore } from '../store/chatStore';
import { llamaService } from '../../../core/ai/LlamaService';
import type { ChatMessage } from '../../../domain/models/Chat';

const QUICK_ACTIONS = [
  "What do I have today?",
  "Show missed items",
  "What's upcoming?",
];

type ModelState = 'loading' | 'ready' | 'error';

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.sender === 'user';
  const isError = msg.messageType === 'error';
  const isSummary = msg.messageType === 'summary';

  return (
    <View style={[styles.bubbleRow, isUser ? styles.bubbleRowUser : styles.bubbleRowAi]}>
      <View style={[
        styles.bubble,
        isUser ? styles.bubbleUser : styles.bubbleAi,
        isError && styles.bubbleError,
        isSummary && styles.bubbleSummary,
      ]}>
        <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>
          {msg.message}
        </Text>
        {msg.messageType === 'action' && msg.actionType ? (
          <Text style={styles.actionTag}>{'\u26a1'} {msg.actionType}</Text>
        ) : null}
      </View>
    </View>
  );
}

export default function ChatScreen({ route }: ChatScreenProps) {
  const { sessionId, openToday } = route.params ?? {};
  const { activeSession, messages, loading, sending, openSession, openTodaySession, send } =
    useChatStore();
  const [input, setInput] = useState('');
  const [modelState, setModelState] = useState<ModelState>(
    llamaService.isInitialized ? 'ready' : llamaService.isLoading ? 'loading' : 'loading',
  );
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    if (openToday) {
      openTodaySession();
    } else if (sessionId) {
      openSession(sessionId);
    } else {
      openTodaySession();
    }
  }, [sessionId, openToday, openSession, openTodaySession]);

  const startModelInit = useCallback(() => {
    setModelState('loading');
    llamaService.initialize()
      .then(() => setModelState('ready'))
      .catch(() => setModelState('error'));
  }, []);

  useEffect(() => {
    if (!llamaService.isInitialized) {
      startModelInit();
    } else {
      setModelState('ready');
    }
  }, [startModelInit]);

  useEffect(() => {
    if (messages.length > 0) {
      listRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages.length]);

  function handleSend(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || sending) return;
    setInput('');
    send(msg);
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      {activeSession && (
        <Text variant="labelSmall" style={styles.sessionDate}>
          {activeSession.sessionDate}
        </Text>
      )}

      {modelState === 'loading' && (
        <View style={styles.modelBanner}>
          <ActivityIndicator size="small" color="#5B3EBF" />
          <Text variant="bodySmall" style={styles.modelBannerText}>
            Loading AI model… (~30s on first open)
          </Text>
        </View>
      )}

      {modelState === 'error' && (
        <View style={[styles.modelBanner, styles.modelBannerError]}>
          <Text variant="bodySmall" style={styles.modelBannerErrorText}>
            Failed to load AI model.
          </Text>
          <Button compact onPress={startModelInit} textColor="#B3261E">
            Retry
          </Button>
        </View>
      )}

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <MessageBubble msg={item} />}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
      />

      {messages.length === 0 && !loading && modelState === 'ready' && (
        <View style={styles.quickActions}>
          {QUICK_ACTIONS.map(qa => (
            <Chip key={qa} style={styles.chip} onPress={() => handleSend(qa)}>
              {qa}
            </Chip>
          ))}
        </View>
      )}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          mode="outlined"
          dense
          placeholder="Ask BuddyAI anything..."
          value={input}
          onChangeText={setInput}
          onSubmitEditing={() => handleSend()}
          returnKeyType="send"
          disabled={sending}
        />
        {sending ? (
          <ActivityIndicator style={styles.sendBtn} />
        ) : (
          <IconButton
            icon="send"
            mode="contained"
            onPress={() => handleSend()}
            disabled={!input.trim()}
            style={styles.sendBtn}
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  sessionDate: { textAlign: 'center', opacity: 0.4, paddingTop: 8 },
  modelBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EDE5FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  modelBannerText: { color: '#5B3EBF', flex: 1 },
  modelBannerError: { backgroundColor: '#F9DEDC' },
  modelBannerErrorText: { color: '#B3261E', flex: 1 },
  messageList: { padding: 12, paddingBottom: 4 },
  bubbleRow: { marginVertical: 4, flexDirection: 'row' },
  bubbleRowUser: { justifyContent: 'flex-end' },
  bubbleRowAi: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '80%', borderRadius: 16, padding: 10 },
  bubbleUser: { backgroundColor: '#5B3EBF' },
  bubbleAi: { backgroundColor: '#e0e0e0' },
  bubbleError: { backgroundColor: '#ffcdd2' },
  bubbleSummary: { backgroundColor: '#e8f5e9', borderWidth: 1, borderColor: '#a5d6a7' },
  bubbleText: { fontSize: 15 },
  bubbleTextUser: { color: '#fff' },
  actionTag: { fontSize: 11, opacity: 0.6, marginTop: 4 },
  quickActions: { padding: 12, gap: 8, flexDirection: 'row', flexWrap: 'wrap' },
  chip: { marginRight: 4 },
  inputRow: { flexDirection: 'row', alignItems: 'center', padding: 8 },
  input: { flex: 1 },
  sendBtn: { marginLeft: 4 },
});
