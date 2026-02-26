import { createMMKV } from 'react-native-mmkv';

export const storage = createMMKV({
  id: 'buddyai-storage',
  encryptionKey: 'buddyai-mmkv-key',
});
