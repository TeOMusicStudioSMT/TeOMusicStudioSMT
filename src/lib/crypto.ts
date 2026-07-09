/**
 * 🔒 crypto.ts — lekkie szyfrowanie lokalne dla Kibla (localStorage).
 *
 * UWAGA (uczciwie): to obfuskacja XOR + base64, nie kryptografia klasy
 * wojskowej — klucz i tak żyje w tym samym localStorage. Cel: klucze API
 * nie leżą plaintextem i nie wychodzą poza urządzenie. Synchactoniczne API,
 * bo Kibel czyta klucze w środku pętli renderów.
 */

function xorWithKey(input: string, key: string): string {
  let out = '';
  for (let i = 0; i < input.length; i++) {
    out += String.fromCharCode(input.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return out;
}

/** Tekst → zaszyfrowany base64 (bezpieczny dla znaków UTF-8). */
export function encryptData(plain: string, key: string): string {
  const utf8 = unescape(encodeURIComponent(plain));
  return btoa(xorWithKey(utf8, key));
}

/** Zaszyfrowany base64 → tekst. Zwraca '' gdy dane uszkodzone. */
export function decryptData(encrypted: string, key: string): string {
  try {
    const xored = atob(encrypted);
    return decodeURIComponent(escape(xorWithKey(xored, key)));
  } catch {
    return '';
  }
}
