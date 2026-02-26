import { storage } from '../mmkv';

describe('MMKV storage', () => {
  beforeEach(() => {
    storage.clearAll();
  });

  describe('booleans', () => {
    it('returns undefined for unset key', () => {
      expect(storage.getBoolean('onboarding_done')).toBeUndefined();
    });

    it('sets and gets a boolean true', () => {
      storage.set('onboarding_done', true);
      expect(storage.getBoolean('onboarding_done')).toBe(true);
    });

    it('sets and gets a boolean false', () => {
      storage.set('onboarding_done', false);
      expect(storage.getBoolean('onboarding_done')).toBe(false);
    });
  });

  describe('strings', () => {
    it('returns undefined for unset key', () => {
      expect(storage.getString('user_name')).toBeUndefined();
    });

    it('sets and gets a string', () => {
      storage.set('user_name', 'Naveen');
      expect(storage.getString('user_name')).toBe('Naveen');
    });
  });

  describe('numbers', () => {
    it('sets and gets a number', () => {
      storage.set('daily_notif_hour', 8);
      expect(storage.getNumber('daily_notif_hour')).toBe(8);
    });
  });

  describe('delete', () => {
    it('removes a key', () => {
      storage.set('user_name', 'Naveen');
      storage.delete('user_name');
      expect(storage.getString('user_name')).toBeUndefined();
    });
  });

  describe('contains', () => {
    it('returns false for missing key', () => {
      expect(storage.contains('missing_key')).toBe(false);
    });

    it('returns true for existing key', () => {
      storage.set('some_key', 'value');
      expect(storage.contains('some_key')).toBe(true);
    });
  });

  describe('getAllKeys', () => {
    it('returns all stored keys', () => {
      storage.set('key_a', 'a');
      storage.set('key_b', 'b');
      const keys = storage.getAllKeys();
      expect(keys).toContain('key_a');
      expect(keys).toContain('key_b');
    });
  });
});
