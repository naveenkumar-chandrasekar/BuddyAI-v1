import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { storage } from '../../../core/storage/mmkv';
import RootNavigator from '../RootNavigator';

jest.mock('../../../features/chat/store/chatStore', () => ({
  useChatStore: jest.fn(() => ({
    sessions: [],
    loading: false,
    loadSessions: jest.fn(),
  })),
}));

const mockRNFS = jest.requireMock('react-native-fs').default;

function Wrapper({ children }: { children: React.ReactNode }) {
  return <NavigationContainer>{children}</NavigationContainer>;
}

describe('RootNavigator — onboarding gate', () => {
  beforeEach(() => {
    storage.clearAll();
    mockRNFS.exists.mockResolvedValue(false);
  });

  it('shows onboarding when onboarding_done is not set', async () => {
    render(<RootNavigator />, { wrapper: Wrapper });
    expect(await screen.findByText('Get Started')).toBeTruthy();
  });

  it('shows onboarding when onboarding_done is false', async () => {
    storage.set('onboarding_done', false);
    render(<RootNavigator />, { wrapper: Wrapper });
    expect(await screen.findByText('Get Started')).toBeTruthy();
  });

  it('shows model download when onboarding done but model missing', async () => {
    storage.set('onboarding_done', true);
    mockRNFS.exists.mockResolvedValue(false);
    render(<RootNavigator />, { wrapper: Wrapper });
    expect(await screen.findByText('AI Model Required')).toBeTruthy();
  });

  it('shows main app when onboarding done and model exists', async () => {
    storage.set('onboarding_done', true);
    storage.set('model_path', '/mock/documents/models/llama-3.2-1b-instruct-q4_k_m.gguf');
    mockRNFS.exists.mockResolvedValue(true);
    render(<RootNavigator />, { wrapper: Wrapper });
    expect(await screen.findByText("Today's Chat")).toBeTruthy();
  });
});
