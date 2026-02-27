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

function Wrapper({ children }: { children: React.ReactNode }) {
  return <NavigationContainer>{children}</NavigationContainer>;
}

describe('RootNavigator — onboarding gate', () => {
  beforeEach(() => {
    storage.clearAll();
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

  it('shows main app when onboarding_done is true', async () => {
    storage.set('onboarding_done', true);
    render(<RootNavigator />, { wrapper: Wrapper });
    expect(await screen.findByText('No chats yet. Tap + to start.')).toBeTruthy();
  });
});
