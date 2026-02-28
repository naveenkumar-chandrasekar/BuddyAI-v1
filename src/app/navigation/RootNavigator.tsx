import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import { storage } from '../../core/storage/mmkv';
import { modelExists } from '../../core/ai/ModelDownloadService';
import OnboardingNavigator from './OnboardingNavigator';
import BottomTabNavigator from './BottomTabNavigator';
import ModelDownloadScreen from '../../features/onboarding/screens/ModelDownloadScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const onboardingDone = storage.getBoolean('onboarding_done') ?? false;
  const [hasModel, setHasModel] = useState<boolean | null>(null);

  useEffect(() => {
    if (!onboardingDone) { setHasModel(false); return; }
    modelExists().then(setHasModel);
  }, [onboardingDone]);

  if (hasModel === null) return null;

  const initialRoute: keyof RootStackParamList =
    !onboardingDone ? 'Onboarding' : !hasModel ? 'ModelDownload' : 'Main';

  return (
    <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
      <Stack.Screen name="ModelDownload" component={ModelDownloadScreen} />
      <Stack.Screen name="Main" component={BottomTabNavigator} />
    </Stack.Navigator>
  );
}
