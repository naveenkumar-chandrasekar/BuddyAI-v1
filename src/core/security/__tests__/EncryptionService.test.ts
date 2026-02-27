import { encrypt, decrypt } from '../EncryptionService';

const KEY_64 = 'a'.repeat(64);
const KEY_64B = 'b'.repeat(64);

describe('EncryptionService', () => {
  it('decrypt(encrypt(text)) returns original text', () => {
    const original = 'Hello, BuddyAi!';
    expect(decrypt(encrypt(original, KEY_64), KEY_64)).toBe(original);
  });

  it('round-trip works for JSON strings', () => {
    const json = JSON.stringify({ id: 'abc', title: 'Buy milk', priority: 2 });
    expect(decrypt(encrypt(json, KEY_64), KEY_64)).toBe(json);
  });

  it('round-trip works for empty string', () => {
    expect(decrypt(encrypt('', KEY_64), KEY_64)).toBe('');
  });

  it('produces different ciphertext each call (random IV)', () => {
    const plain = 'same text';
    const c1 = encrypt(plain, KEY_64);
    const c2 = encrypt(plain, KEY_64);
    expect(c1).not.toBe(c2);
  });

  it('ciphertext with wrong key does not produce original plaintext', () => {
    const plain = 'secret data';
    const ciphertext = encrypt(plain, KEY_64);
    let result: string;
    try {
      result = decrypt(ciphertext, KEY_64B);
    } catch {
      result = '';
    }
    expect(result).not.toBe(plain);
  });

  it('decrypt returns correct text for unicode content', () => {
    const text = 'नमस्ते 🎂 Üñíçödé';
    expect(decrypt(encrypt(text, KEY_64), KEY_64)).toBe(text);
  });
});
