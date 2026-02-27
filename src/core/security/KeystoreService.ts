import * as Keychain from 'react-native-keychain';

const SERVICE = 'com.buddyai.dbkey';
const USERNAME = 'buddyai';

function generateHexKey(): string {
  const chars = '0123456789abcdef';
  let key = '';
  for (let i = 0; i < 64; i++) {
    key += chars[Math.floor(Math.random() * 16)];
  }
  return key;
}

export async function getOrCreateKey(): Promise<string> {
  const existing = await Keychain.getGenericPassword({ service: SERVICE });
  if (existing) return existing.password;

  const key = generateHexKey();
  await Keychain.setGenericPassword(USERNAME, key, { service: SERVICE });
  return key;
}

export async function getKey(): Promise<string | null> {
  const result = await Keychain.getGenericPassword({ service: SERVICE });
  return result ? result.password : null;
}

export async function clearKey(): Promise<void> {
  await Keychain.resetGenericPassword({ service: SERVICE });
}
