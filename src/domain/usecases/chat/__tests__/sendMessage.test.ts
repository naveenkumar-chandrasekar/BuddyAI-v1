import { sendMessage } from '../SendMessageUseCase';

jest.mock('../../../../data/repositories/ChatRepository', () => ({
  chatMessageRepository: { create: jest.fn(), getRecentBySessionId: jest.fn() },
  chatSessionRepository: { getAll: jest.fn(), getByDate: jest.fn(), create: jest.fn() },
}));

jest.mock('../../../../core/ai/AgentOrchestrator', () => ({
  processMessage: jest.fn(),
  clearPending: jest.fn(),
}));

const { chatMessageRepository } = jest.requireMock('../../../../data/repositories/ChatRepository');
const orchestratorMock = jest.requireMock('../../../../core/ai/AgentOrchestrator');

const makeMsg = (overrides = {}) => ({
  id: 'm1', sessionId: 'sess1', sender: 'user' as const, message: 'hello',
  messageType: 'text' as const, actionType: null, actionPayload: null,
  isProcessed: false, createdAt: Date.now(),
  ...overrides,
});

describe('sendMessage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns model-not-loaded message when model not initialized', async () => {
    orchestratorMock.processMessage.mockResolvedValue({
      type: 'error', message: 'AI model not loaded.',
    });
    chatMessageRepository.create
      .mockResolvedValueOnce(makeMsg({ sender: 'user' }))
      .mockResolvedValueOnce(makeMsg({ sender: 'ai', messageType: 'error' }));

    const { aiMessage } = await sendMessage('sess1', 'Hello');

    expect(aiMessage.messageType).toBe('error');
    const secondCallArg = chatMessageRepository.create.mock.calls[1][0];
    expect(secondCallArg.message).toContain('not loaded');
  });

  it('saves user message and AI reply for conversational intent', async () => {
    orchestratorMock.processMessage.mockResolvedValue({
      type: 'reply', message: 'Hi there!',
    });
    chatMessageRepository.create
      .mockResolvedValueOnce(makeMsg({ sender: 'user', message: 'Hello' }))
      .mockResolvedValueOnce(makeMsg({ sender: 'ai', message: 'Hi there!', messageType: 'text' }));

    const { userMessage, aiMessage } = await sendMessage('sess1', 'Hello');

    expect(userMessage.sender).toBe('user');
    expect(aiMessage.sender).toBe('ai');
    const aiCallArg = chatMessageRepository.create.mock.calls[1][0];
    expect(aiCallArg.messageType).toBe('text');
    expect(aiCallArg.message).toBe('Hi there!');
  });

  it('executes action for non-conversational intent and saves action message', async () => {
    orchestratorMock.processMessage.mockResolvedValue({
      type: 'reply', message: 'Task created!', actionType: 'CREATE_TASK',
    });
    chatMessageRepository.create
      .mockResolvedValueOnce(makeMsg({ sender: 'user' }))
      .mockResolvedValueOnce(makeMsg({ sender: 'ai', messageType: 'action' }));

    await sendMessage('sess1', 'Add a task to buy milk today');

    const aiCallArg = chatMessageRepository.create.mock.calls[1][0];
    expect(aiCallArg.messageType).toBe('action');
    expect(aiCallArg.actionType).toBe('CREATE_TASK');
  });

  it('asks for due date when CREATE_TASK has no date, then executes on follow-up', async () => {
    orchestratorMock.processMessage
      .mockResolvedValueOnce({ type: 'question', message: 'When is "Buy milk" due?' })
      .mockResolvedValueOnce({ type: 'reply', message: 'Task created!', actionType: 'CREATE_TASK' });

    chatMessageRepository.create
      .mockResolvedValueOnce(makeMsg({ sender: 'user', message: 'add task buy milk' }))
      .mockResolvedValueOnce(makeMsg({ sender: 'ai', message: 'When is "Buy milk" due?', messageType: 'text' }));

    await sendMessage('sess1', 'add task buy milk');
    const askArg = chatMessageRepository.create.mock.calls[1][0];
    expect(askArg.messageType).toBe('text');

    chatMessageRepository.create
      .mockResolvedValueOnce(makeMsg({ sender: 'user', message: 'tomorrow' }))
      .mockResolvedValueOnce(makeMsg({ sender: 'ai', messageType: 'action', actionType: 'CREATE_TASK' }));

    await sendMessage('sess1', 'tomorrow');
    const actionArg = chatMessageRepository.create.mock.calls[3][0];
    expect(actionArg.actionType).toBe('CREATE_TASK');
  });

  it('returns error message if orchestrator throws', async () => {
    orchestratorMock.processMessage.mockRejectedValue(new Error('inference failed'));
    chatMessageRepository.create
      .mockResolvedValueOnce(makeMsg({ sender: 'user' }))
      .mockResolvedValueOnce(makeMsg({ sender: 'ai', messageType: 'error' }));

    const { aiMessage } = await sendMessage('sess1', 'Hello');
    expect(aiMessage.messageType).toBe('error');
  });
});
