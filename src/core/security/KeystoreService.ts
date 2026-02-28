import * as Keychain from 'react-native-keychain';

const USERNAME = 'buddyai';

function svc(userId: string): string {
  return `com.buddyai.dbkey.${userId}`;
}

function generateHexKey(): string {
  const chars = '0123456789abcdef';
  let key = '';
  for (let i = 0; i < 64; i++) {
    key += chars[Math.floor(Math.random() * 16)];
  }
  return key;
}

export async function getOrCreateKey(userId: string): Promise<string> {
  const existing = await Keychain.getGenericPassword({ service: svc(userId) });
  if (existing) return existing.password;

  const key = generateHexKey();
  await Keychain.setGenericPassword(USERNAME, key, { service: svc(userId) });
  return key;
}

export async function getKey(userId: string): Promise<string | null> {
  const result = await Keychain.getGenericPassword({ service: svc(userId) });
  return result ? result.password : null;
}

export async function setKey(userId: string, key: string): Promise<void> {
  await Keychain.setGenericPassword(USERNAME, key, { service: svc(userId) });
}

export async function clearKey(userId: string): Promise<void> {
  await Keychain.resetGenericPassword({ service: svc(userId) });
}
