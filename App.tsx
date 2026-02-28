import React, { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import type { LinkingOptions } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import RootNavigator from './src/app/navigation/RootNavigator';
import { AppTheme } from './src/shared/theme/theme';
import { createNotificationChannels } from './src/core/notifications/NotifeeService';
import { initBackgroundFetch } from './src/core/notifications/BackgroundService';
import { populateBirthdayReminders } from './src/domain/usecases/notifications/BirthdayReminderUseCase';
import { storage } from './src/core/storage/mmkv';
import {
  getOrCreateKey,
  getKey,
  setKey,
} from './src/core/security/KeystoreService';
import { initDatabase, resetDatabase } from './src/data/database/database';
import { syncToDrive } from './src/domain/usecases/sync/SyncUseCase';
import {
  getCurrentUser,
  getAccessToken,
  onAuthStateChanged,
  type AppUser,
} from './src/data/firebase/FirebaseAuth';
import { downloadKeyFromDrive } from './src/data/google-drive/DriveBackupService';
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

async function resolveKeyForUser(user: AppUser): Promise<string> {
  const existing = await getKey(user.uid);
  if (existing) return existing;

  const token = await getAccessToken();
  if (token) {
    const driveKey = await downloadKeyFromDrive(token);
    if (driveKey) {
      await setKey(user.uid, driveKey);
      return driveKey;
    }
  }

  return getOrCreateKey(user.uid);
}

async function switchToUser(user: AppUser | null): Promise<void> {
  resetDatabase();
  if (user) {
    const encKey = await resolveKeyForUser(user);
    initDatabase(encKey, user.uid);
  } else {
    const encKey = await getOrCreateKey('anon');
    initDatabase(encKey);
  }
}

export default function App() {
  const currentUidRef = useRef<string | null>(null);

  useEffect(() => {
    async function bootstrap() {
      const user = getCurrentUser();
      currentUidRef.current = user?.uid ?? null;

      if (user) {
        const encKey = await resolveKeyForUser(user);
        initDatabase(encKey, user.uid);
      } else {
        const encKey = await getOrCreateKey('anon');
        initDatabase(encKey);
      }

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

    const authUnsub = onAuthStateChanged(user => {
      const newUid = user?.uid ?? null;
      if (newUid !== currentUidRef.current) {
        currentUidRef.current = newUid;
        switchToUser(user).catch(() => {});
      }
    });

    const appStateSub = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') {
        syncToDrive().catch(() => {});
      }
    });

    return () => {
      authUnsub();
      appStateSub.remove();
    };
  }, []);

  return (
    <PaperProvider theme={AppTheme}>
      <SafeAreaProvider>
        <NavigationContainer linking={linking}>
          <RootNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </PaperProvider>
  );
}
