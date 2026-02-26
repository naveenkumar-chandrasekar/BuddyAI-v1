import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from './types';
import OnboardingWelcomeScreen from '../../features/onboarding/screens/OnboardingWelcomeScreen';
import OnboardingNameScreen from '../../features/onboarding/screens/OnboardingNameScreen';
import OnboardingNotifScreen from '../../features/onboarding/screens/OnboardingNotifScreen';
import OnboardingPermissionScreen from '../../features/onboarding/screens/OnboardingPermissionScreen';
import OnboardingReadyScreen from '../../features/onboarding/screens/OnboardingReadyScreen';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export default function OnboardingNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OnboardingWelcome" component={OnboardingWelcomeScreen} />
      <Stack.Screen name="OnboardingName" component={OnboardingNameScreen} />
      <Stack.Screen name="OnboardingNotif" component={OnboardingNotifScreen} />
      <Stack.Screen name="OnboardingPermission" component={OnboardingPermissionScreen} />
      <Stack.Screen name="OnboardingReady" component={OnboardingReadyScreen} />
    </Stack.Navigator>
  );
}
