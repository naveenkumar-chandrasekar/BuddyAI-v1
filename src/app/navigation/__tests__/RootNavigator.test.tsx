import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { storage } from '../../../core/storage/mmkv';
import RootNavigator from '../RootNavigator';

function Wrapper({ children }: { children: React.ReactNode }) {
  return <NavigationContainer>{children}</NavigationContainer>;
}

describe('RootNavigator — onboarding gate', () => {
  beforeEach(() => {
    storage.clearAll();
  });

  it('shows onboarding when onboarding_done is not set', async () => {
    render(<RootNavigator />, { wrapper: Wrapper });
    expect(await screen.findByText('OnboardingWelcomeScreen')).toBeTruthy();
  });

  it('shows onboarding when onboarding_done is false', async () => {
    storage.set('onboarding_done', false);
    render(<RootNavigator />, { wrapper: Wrapper });
    expect(await screen.findByText('OnboardingWelcomeScreen')).toBeTruthy();
  });

  it('shows main app when onboarding_done is true', async () => {
    storage.set('onboarding_done', true);
    render(<RootNavigator />, { wrapper: Wrapper });
    expect(await screen.findByText('ChatHistoryScreen')).toBeTruthy();
  });
});
