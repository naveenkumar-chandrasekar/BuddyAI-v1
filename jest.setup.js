// Mock native modules that can't run in Jest
jest.mock('react-native-mmkv', () => ({
  createMMKV: jest.fn(() => {
    const store = new Map();
    return {
      set: (key, value) => store.set(key, value),
      getString: key => store.get(key),
      getNumber: key => store.get(key),
      getBoolean: key => store.get(key),
      delete: key => store.delete(key),
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
