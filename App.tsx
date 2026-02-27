import React, { useEffect } from 'react';
import { AppState } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import type { LinkingOptions } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/app/navigation/RootNavigator';
import { createNotificationChannels } from './src/core/notifications/NotifeeService';
import { initBackgroundFetch } from './src/core/notifications/BackgroundService';
import { populateBirthdayReminders } from './src/domain/usecases/notifications/BirthdayReminderUseCase';
import { storage } from './src/core/storage/mmkv';
import { getOrCreateKey } from './src/core/security/KeystoreService';
import { initDatabase } from './src/data/database/database';
import { syncToFirebase } from './src/domain/usecases/sync/SyncUseCase';
import notifee, { EventType } from '@notifee/react-native';
import { dismissMissedItem } from './src/domain/usecases/tasks/DismissMissedItemUseCase';

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

notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.ACTION_PRESS && detail.pressAction) {
    const actionId = detail.pressAction.id;
    const data = detail.notification?.data as Record<string, string> | undefined;
    if (actionId?.startsWith('dismiss-') && data?.type && data?.itemId) {
      await dismissMissedItem(data.type as 'task' | 'todo' | 'reminder', data.itemId);
    }
  }
});

export default function App() {
  useEffect(() => {
    async function bootstrap() {
      const encKey = await getOrCreateKey();
      initDatabase(encKey);

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

    const sub = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') {
        syncToFirebase().catch(() => {});
      }
    });
    return () => sub.remove();
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer linking={linking}>
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
