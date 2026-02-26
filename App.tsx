import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import type { LinkingOptions } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/app/navigation/RootNavigator';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const linking: LinkingOptions<any> = {
  prefixes: ['buddyai://'],
  config: {
    screens: {
      Main: {
        screens: {
          ChatTab: {
            screens: {
              Chat: 'chat',
            },
          },
          PeopleTab: {
            screens: {
              PersonDetail: 'person/:personId',
            },
          },
          TasksTab: {
            screens: {
              AddEditTask: 'task/:taskId',
            },
          },
        },
      },
    },
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer linking={linking}>
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
