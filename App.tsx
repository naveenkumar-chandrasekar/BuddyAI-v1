import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import type { LinkingOptions } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/app/navigation/RootNavigator';
import { createNotificationChannels } from './src/core/notifications/NotifeeService';
import { initBackgroundFetch } from './src/core/notifications/BackgroundService';
import { populateBirthdayReminders } from './src/domain/usecases/notifications/BirthdayReminderUseCase';
import { storage } from './src/core/storage/mmkv';

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

const BIRTHDAY_REFRESH_KEY = 'birthday_refresh_year';

export default function App() {
  useEffect(() => {
    async function bootstrap() {
      await createNotificationChannels();
      await initBackgroundFetch();

      const currentYear = new Date().getFullYear();
      const lastRefreshYear = storage.getNumber(BIRTHDAY_REFRESH_KEY);
      if (lastRefreshYear !== currentYear) {
        await populateBirthdayReminders();
        storage.set(BIRTHDAY_REFRESH_KEY, currentYear);
      }
    }

    bootstrap();
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer linking={linking}>
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
