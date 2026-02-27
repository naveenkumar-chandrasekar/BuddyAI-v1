import { sendMessage } from '../SendMessageUseCase';

jest.mock('../../../../data/repositories/ChatRepository', () => ({
  chatMessageRepository: { create: jest.fn(), getRecentBySessionId: jest.fn() },
  chatSessionRepository: { getAll: jest.fn(), getByDate: jest.fn(), create: jest.fn() },
}));

jest.mock('../../../../core/ai/LlamaService', () => ({
  llamaService: {
    isInitialized: false,
    complete: jest.fn(),
  },
}));

jest.mock('../../../../core/ai/PromptBuilder', () => ({
  buildPrompt: jest.fn().mockResolvedValue('prompt text'),
}));

jest.mock('../../../../core/ai/IntentParser', () => ({
  parseIntent: jest.fn(),
  isConversationalOnly: jest.fn(),
}));

jest.mock('../../../../core/ai/ActionExecutor', () => ({
  executeAction: jest.fn().mockResolvedValue({ success: true }),
}));

const { chatMessageRepository } = jest.requireMock('../../../../data/repositories/ChatRepository');
const llamaMod = jest.requireMock('../../../../core/ai/LlamaService');
const { parseIntent, isConversationalOnly } = jest.requireMock('../../../../core/ai/IntentParser');

const makeMsg = (overrides = {}) => ({
  id: 'm1', sessionId: 'sess1', sender: 'user' as const, message: 'hello',
  messageType: 'text' as const, actionType: null, actionPayload: null,
  isProcessed: false, createdAt: Date.now(),
  ...overrides,
});

describe('sendMessage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    llamaMod.llamaService.isInitialized = false;
  });

  it('returns model-not-loaded message when LlamaService not initialized', async () => {
    chatMessageRepository.create
      .mockResolvedValueOnce(makeMsg({ sender: 'user' }))
      .mockResolvedValueOnce(makeMsg({ sender: 'ai', messageType: 'error' }));

    const { userMessage, aiMessage } = await sendMessage('sess1', 'Hello');

    expect(userMessage.sender).toBe('user');
    expect(aiMessage.messageType).toBe('error');
    const secondCallArg = chatMessageRepository.create.mock.calls[1][0];
    expect(secondCallArg.message).toContain('not loaded');
  });

  it('saves user message and AI reply for conversational intent', async () => {
    llamaMod.llamaService.isInitialized = true;
    llamaMod.llamaService.complete.mockResolvedValue('...');

    parseIntent.mockReturnValue({ intent: 'CONVERSATION_INTENT', action: 'GENERAL_CHAT', message: 'Hi there!', data: {} });
    isConversationalOnly.mockReturnValue(true);

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
    const { executeAction } = jest.requireMock('../../../../core/ai/ActionExecutor');
    llamaMod.llamaService.isInitialized = true;
    llamaMod.llamaService.complete.mockResolvedValue('...');

    parseIntent.mockReturnValue({
      intent: 'TASK_INTENT', action: 'CREATE_TASK', message: 'Task created!',
      data: { title: 'Buy milk' },
    });
    isConversationalOnly.mockReturnValue(false);

    chatMessageRepository.create
      .mockResolvedValueOnce(makeMsg({ sender: 'user' }))
      .mockResolvedValueOnce(makeMsg({ sender: 'ai', messageType: 'action' }));

    await sendMessage('sess1', 'Add a task to buy milk');

    expect(executeAction).toHaveBeenCalledWith(expect.objectContaining({ action: 'CREATE_TASK' }));
    const aiCallArg = chatMessageRepository.create.mock.calls[1][0];
    expect(aiCallArg.messageType).toBe('action');
    expect(aiCallArg.actionType).toBe('CREATE_TASK');
  });

  it('returns error message if inference throws', async () => {
    llamaMod.llamaService.isInitialized = true;
    llamaMod.llamaService.complete.mockRejectedValue(new Error('inference failed'));

    chatMessageRepository.create
      .mockResolvedValueOnce(makeMsg({ sender: 'user' }))
      .mockResolvedValueOnce(makeMsg({ sender: 'ai', messageType: 'error' }));

    const { aiMessage } = await sendMessage('sess1', 'Hello');
    expect(aiMessage.messageType).toBe('error');
  });
});
