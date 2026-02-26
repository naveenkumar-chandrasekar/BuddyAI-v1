module.exports = {
  preset: 'react-native',
  setupFiles: ['./jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|react-native-mmkv|react-native-safe-area-context|react-native-screens|react-native-paper|react-native-vector-icons|react-native-tab-view|react-native-pager-view|@nozbe/watermelondb)/)',
  ],
};
