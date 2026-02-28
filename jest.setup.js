// Mock native modules that can't run in Jest
jest.mock('react-native-mmkv', () => ({
  createMMKV: jest.fn(() => {
    const store = new Map();
    return {
      set: (key, value) => store.set(key, value),
      getString: key => store.get(key),
      getNumber: key => store.get(key),
      getBoolean: key => store.get(key),
      remove: key => store.delete(key),
      contains: key => store.has(key),
      clearAll: () => store.clear(),
      getAllKeys: () => Array.from(store.keys()),
    };
  }),
}));

jest.mock('@nozbe/watermelondb/adapters/sqlite', () => {
  const { schema: appSchema } = require('./src/data/database/schema/index');
  return jest.fn().mockImplementation(() => ({
    schema: appSchema,
    find: jest.fn(),
    query: jest.fn().mockResolvedValue([]),
    queryIds: jest.fn().mockResolvedValue([]),
    unsafeQueryRaw: jest.fn().mockResolvedValue([]),
    count: jest.fn().mockResolvedValue(0),
    batch: jest.fn().mockResolvedValue(undefined),
    batchJSON: jest.fn(),
    getDeletedRecords: jest.fn().mockResolvedValue([]),
    destroyDeletedRecords: jest.fn().mockResolvedValue(undefined),
    unsafeResetDatabase: jest.fn().mockResolvedValue(undefined),
    getLocal: jest.fn().mockResolvedValue(undefined),
    setLocal: jest.fn().mockResolvedValue(undefined),
    removeLocal: jest.fn().mockResolvedValue(undefined),
    testClone: jest.fn(),
  }));
});

jest.mock('react-native-safe-area-context', () => {
  const { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } =
    jest.requireActual('react-native-safe-area-context');
  return {
    SafeAreaProvider,
    SafeAreaView,
    useSafeAreaInsets,
    SafeAreaInsetsContext: { Consumer: ({ children }) => children({ top: 0, bottom: 0, left: 0, right: 0 }) },
    initialWindowMetrics: { frame: { x: 0, y: 0, width: 375, height: 812 }, insets: { top: 44, left: 0, bottom: 34, right: 0 } },
  };
});

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
    useRoute: () => ({ params: {} }),
  };
});

jest.mock('react-native-screens', () => ({
  enableScreens: jest.fn(),
  Screen: 'Screen',
  ScreenContainer: 'ScreenContainer',
  NativeScreen: 'NativeScreen',
  NativeScreenContainer: 'NativeScreenContainer',
  ScreenStack: 'ScreenStack',
  ScreenStackHeaderConfig: 'ScreenStackHeaderConfig',
}));

const mockNavigatorFactory = () => {
  const React = require('react');

  const Navigator = ({ children, initialRouteName }) => {
    const screens = {};
    React.Children.forEach(children, child => {
      if (child?.props?.name) screens[child.props.name] = child.props.component;
    });
    const ScreenComponent = initialRouteName
      ? screens[initialRouteName]
      : Object.values(screens)[0];
    return ScreenComponent ? React.createElement(ScreenComponent) : null;
  };
  const Screen = () => null;
  const Group = () => null;
  return { Navigator, Screen, Group };
};

jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: mockNavigatorFactory,
}));

jest.mock('@react-navigation/bottom-tabs', () => ({
  createBottomTabNavigator: mockNavigatorFactory,
}));

jest.mock('@react-navigation/material-top-tabs', () => ({
  createMaterialTopTabNavigator: mockNavigatorFactory,
}));

jest.mock('@notifee/react-native', () => ({
  __esModule: true,
  default: {
    createChannel: jest.fn().mockResolvedValue(undefined),
    createTriggerNotification: jest.fn().mockResolvedValue('notif-id'),
    cancelNotification: jest.fn().mockResolvedValue(undefined),
    displayNotification: jest.fn().mockResolvedValue('notif-id'),
    getInitialNotification: jest.fn().mockResolvedValue(null),
    onForegroundEvent: jest.fn(() => () => {}),
    onBackgroundEvent: jest.fn(),
    getTriggerNotificationIds: jest.fn().mockResolvedValue([]),
    cancelAllNotifications: jest.fn().mockResolvedValue(undefined),
  },
  AndroidImportance: { HIGH: 4, DEFAULT: 3, LOW: 2, MIN: 1, NONE: 0 },
  AndroidVisibility: { PUBLIC: 1, PRIVATE: 0, SECRET: -1 },
  TriggerType: { TIMESTAMP: 0, INTERVAL: 1 },
  EventType: { DISMISSED: 0, PRESS: 1, ACTION_PRESS: 2, DELIVERED: 3 },
}));

jest.mock('react-native-background-fetch', () => ({
  __esModule: true,
  default: {
    configure: jest.fn().mockResolvedValue(2),
    start: jest.fn().mockResolvedValue(2),
    stop: jest.fn().mockResolvedValue(true),
    finish: jest.fn(),
    scheduleTask: jest.fn().mockResolvedValue(true),
    NETWORK_TYPE_NONE: 0,
    NETWORK_TYPE_ANY: 1,
    STATUS_AVAILABLE: 2,
  },
}));

jest.mock('react-native-keychain', () => ({
  getGenericPassword: jest.fn().mockResolvedValue(false),
  setGenericPassword: jest.fn().mockResolvedValue(true),
  resetGenericPassword: jest.fn().mockResolvedValue(true),
}));

jest.mock('@react-native-firebase/app', () => ({
  __esModule: true,
  default: jest.fn(() => ({})),
}));

jest.mock('@react-native-firebase/auth', () => {
  const mockUser = null;
  const authInstance = {
    currentUser: mockUser,
    signInWithCredential: jest.fn().mockResolvedValue({ user: { uid: 'u1', email: 'test@test.com', displayName: 'Test' } }),
    signOut: jest.fn().mockResolvedValue(undefined),
    onAuthStateChanged: jest.fn(cb => { cb(null); return () => {}; }),
  };
  const authFn = jest.fn(() => authInstance);
  authFn.GoogleAuthProvider = { credential: jest.fn(() => ({})) };
  return { __esModule: true, default: authFn };
});

jest.mock('@react-native-firebase/firestore', () => {
  const batchMock = { set: jest.fn(), commit: jest.fn().mockResolvedValue(undefined) };
  const docMock = { set: jest.fn().mockResolvedValue(undefined), get: jest.fn().mockResolvedValue({ exists: false, data: () => ({}) }) };
  const snapshotMock = { empty: true, docs: [] };
  const colMock = { doc: jest.fn(() => docMock), get: jest.fn().mockResolvedValue(snapshotMock) };
  const firestoreInstance = {
    batch: jest.fn(() => batchMock),
    collection: jest.fn(() => ({ doc: jest.fn(() => ({ collection: jest.fn(() => colMock) })) })),
  };
  return { __esModule: true, default: jest.fn(() => firestoreInstance) };
});

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn().mockResolvedValue(true),
    signIn: jest.fn().mockResolvedValue({ data: { idToken: 'mock-token' } }),
    signOut: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('react-native-fs', () => ({
  __esModule: true,
  default: {
    DocumentDirectoryPath: '/mock/documents',
    exists: jest.fn().mockResolvedValue(false),
    mkdir: jest.fn().mockResolvedValue(undefined),
    unlink: jest.fn().mockResolvedValue(undefined),
    downloadFile: jest.fn(() => ({
      promise: Promise.resolve({ statusCode: 200, bytesWritten: 0 }),
    })),
  },
}));

jest.mock('llama.rn', () => ({
  __esModule: true,
  initLlama: jest.fn().mockResolvedValue({
    completion: jest.fn().mockResolvedValue({ text: '{"intent":"CONVERSATION_INTENT","action":"GENERAL_CHAT","message":"Hello!","data":{}}' }),
    release: jest.fn().mockResolvedValue(undefined),
  }),
}));
