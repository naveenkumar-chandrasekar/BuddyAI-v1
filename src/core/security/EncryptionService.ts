import CryptoJS from 'crypto-js';

export function encrypt(plaintext: string, hexKey: string): string {
  const key = CryptoJS.enc.Hex.parse(hexKey);
  const iv = CryptoJS.lib.WordArray.random(16);
  const encrypted = CryptoJS.AES.encrypt(plaintext, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });
  return iv.toString() + encrypted.ciphertext.toString();
}

export function decrypt(ciphertextHex: string, hexKey: string): string {
  const key = CryptoJS.enc.Hex.parse(hexKey);
  const iv = CryptoJS.enc.Hex.parse(ciphertextHex.substring(0, 32));
  const ciphertext = CryptoJS.enc.Hex.parse(ciphertextHex.substring(32));
  const params = CryptoJS.lib.CipherParams.create({ ciphertext });
  const decrypted = CryptoJS.AES.decrypt(params, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });
  return decrypted.toString(CryptoJS.enc.Utf8);
}
