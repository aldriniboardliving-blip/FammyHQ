import CryptoJS from "crypto-js";

const PBKDF2_ITERATIONS = 600000;
const KEY_SIZE = 256 / 32;

/**
 * Generate random bytes as a CryptoJS WordArray, bypassing crypto-js's
 * native crypto detection which fails in React Native Hermes.
 */
function randomWordArray(nBytes: number) {
  const words: number[] = [];
  for (let i = 0; i < nBytes; i += 4) {
    words.push((Math.random() * 0x100000000) >>> 0);
  }
  return CryptoJS.lib.WordArray.create(words, nBytes);
}

/**
 * Encrypt a payload using AES-256 with a key derived from the invite code.
 *
 * The invite code itself is used as the passphrase for PBKDF2,
 * so only someone who knows the code can decrypt.
 *
 * Returns base64-encoded ciphertext, iv, and salt.
 */
export function encryptPayload(
  payload: object,
  code: string,
): { ciphertext: string; iv: string; salt: string } {
  const salt = randomWordArray(16);
  const iv = randomWordArray(16);

  const key = CryptoJS.PBKDF2(code.normalize("NFKC"), salt, {
    keySize: KEY_SIZE,
    iterations: PBKDF2_ITERATIONS,
    hasher: CryptoJS.algo.SHA256,
  });

  const encrypted = CryptoJS.AES.encrypt(JSON.stringify(payload), key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  return {
    ciphertext: encrypted.toString(),
    iv: CryptoJS.enc.Base64.stringify(iv),
    salt: CryptoJS.enc.Base64.stringify(salt),
  };
}

/**
 * Decrypt a payload that was encrypted with encryptPayload.
 */
export function decryptPayload<T>(
  ciphertext: string,
  ivBase64: string,
  saltBase64: string,
  code: string,
): T {
  const salt = CryptoJS.enc.Base64.parse(saltBase64);
  const iv = CryptoJS.enc.Base64.parse(ivBase64);

  const key = CryptoJS.PBKDF2(code.normalize("NFKC"), salt, {
    keySize: KEY_SIZE,
    iterations: PBKDF2_ITERATIONS,
    hasher: CryptoJS.algo.SHA256,
  });

  const decrypted = CryptoJS.AES.decrypt(ciphertext, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  const plaintext = decrypted.toString(CryptoJS.enc.Utf8);
  if (!plaintext) throw new Error("Decryption failed — wrong code or corrupted data");

  return JSON.parse(plaintext) as T;
}
