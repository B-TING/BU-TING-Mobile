module.exports = {
  preset: '@react-native/jest-preset',
  moduleNameMapper: {
    '\\.css$': '<rootDir>/__mocks__/styleMock.js',
    '^lucide-react-native$': '<rootDir>/__mocks__/lucide-react-native.js',
  },
  testPathIgnorePatterns: ['/node_modules/', '/__tests__/helpers/', '/.maestro/'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|react-native-screens|react-native-safe-area-context|@react-native-async-storage|nativewind|react-native-css-interop|react-native-webview|react-native-svg)/)',
  ],
};
