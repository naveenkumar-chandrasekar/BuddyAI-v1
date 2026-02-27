import { parseIntent, isConversationalOnly } from '../IntentParser';

describe('parseIntent', () => {
  it('parses valid JSON response', () => {
    const raw = `{"intent":"TASK_INTENT","action":"CREATE_TASK","message":"Task created!","data":{"title":"Buy milk"}}`;
    const intent = parseIntent(raw);
    expect(intent.intent).toBe('TASK_INTENT');
    expect(intent.action).toBe('CREATE_TASK');
    expect(intent.message).toBe('Task created!');
    expect(intent.data).toEqual({ title: 'Buy milk' });
  });

  it('extracts JSON from text with surrounding content', () => {
    const raw = `Sure, here you go: {"intent":"PEOPLE_INTENT","action":"CREATE_PERSON","message":"Added John!","data":{"name":"John"}} Done.`;
    const intent = parseIntent(raw);
    expect(intent.intent).toBe('PEOPLE_INTENT');
    expect(intent.action).toBe('CREATE_PERSON');
  });

  it('returns fallback for invalid JSON', () => {
    const intent = parseIntent('This is not JSON at all');
    expect(intent.intent).toBe('CONVERSATION_INTENT');
    expect(intent.action).toBe('UNKNOWN');
  });

  it('returns fallback for malformed JSON', () => {
    const intent = parseIntent('{broken json}');
    expect(intent.intent).toBe('CONVERSATION_INTENT');
  });

  it('returns fallback when required fields are missing', () => {
    const intent = parseIntent('{"intent":"TASK_INTENT"}');
    expect(intent.action).toBe('UNKNOWN');
  });

  it('uses empty data object when data field is missing', () => {
    const raw = `{"intent":"CONVERSATION_INTENT","action":"GENERAL_CHAT","message":"Hi!"}`;
    const intent = parseIntent(raw);
    expect(intent.data).toEqual({});
  });
});

describe('isConversationalOnly', () => {
  it('returns true for CONVERSATION_INTENT', () => {
    expect(isConversationalOnly({ intent: 'CONVERSATION_INTENT', action: 'GENERAL_CHAT', message: '', data: {} })).toBe(true);
  });

  it('returns true for UNKNOWN action', () => {
    expect(isConversationalOnly({ intent: 'QUERY_INTENT', action: 'UNKNOWN', message: '', data: {} })).toBe(true);
  });

  it('returns false for action intents', () => {
    expect(isConversationalOnly({ intent: 'TASK_INTENT', action: 'CREATE_TASK', message: '', data: {} })).toBe(false);
  });

  it('returns false for people intents', () => {
    expect(isConversationalOnly({ intent: 'PEOPLE_INTENT', action: 'CREATE_PERSON', message: '', data: {} })).toBe(false);
  });
});
