import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import { storage } from '../../core/storage/mmkv';
import OnboardingNavigator from './OnboardingNavigator';
import BottomTabNavigator from './BottomTabNavigator';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const onboardingDone = storage.getBoolean('onboarding_done') ?? false;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {onboardingDone ? (
        <Stack.Screen name="Main" component={BottomTabNavigator} />
      ) : (
        <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
      )}
    </Stack.Navigator>
  );
}
