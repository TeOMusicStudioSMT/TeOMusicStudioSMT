/**
 * 🔐 KIBEL - Local Secure Vault
 * 
 * "Najbezpieczniejsze miejsce w galaktyce"
 * 
 * Zasady:
 * - Klucze NIGDY nie opuszczają urządzenia
 * - Pobieranie tylko w momencie wykonywania akcji
 * - Szyfrowanie w LocalStorage
 * - Brak przesyłania do chmury
 */

import { encryptData, decryptData } from './crypto';

// Prefix dla kluczy w LocalStorage
const KIBEL_PREFIX = 'kibel_';

// Interfejs klucza API
export interface KibelKey {
  id: string;
  name: string;
  provider: 'gemini' | 'suno' | 'openai' | 'anthropic' | 'custom';
  value: string; // Zaszyfrowana wartość
  createdAt: number;
  lastUsed: number;
}

// Interfejs konfiguracji
export interface KibelConfig {
  encryptionKey: string; // Klucz szyfrowania (生成owany lokalnie)
}

/**
 * Pobierz lub wygeneruj klucz szyfrowania
 */
function getEncryptionKey(): string {
  let key = localStorage.getItem(KIBEL_PREFIX + 'master_key');
  if (!key) {
    // Generuj unikalny klucz dla urządzenia
    key = crypto.randomUUID() + '-' + Date.now();
    localStorage.setItem(KIBEL_PREFIX + 'master_key', key);
  }
  return key;
}

/**
 * Zapisz klucz API do Kibel
 */
export function storeKey(key: KibelKey): void {
  const keyName = `${KIBEL_PREFIX}key_${key.provider}_${key.id}`;
  const encrypted = encryptData(key.value, getEncryptionKey());
  
  const storedKey = {
    ...key,
    value: encrypted,
    createdAt: Date.now(),
  };
  
  localStorage.setItem(keyName, JSON.stringify(storedKey));
  console.log(`[Kibel] 🔐 Zapisano klucz: ${key.provider}/${key.name}`);
}

/**
 * Pobierz klucz API z Kibel (tylko do użytku!)
 */
export function retrieveKey(provider: string, keyId?: string): string | null {
  const prefix = `${KIBEL_PREFIX}key_${provider}`;
  
  // Szukaj klucza
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix)) {
      if (keyId && !key.includes(keyId)) continue;
      
      const stored = JSON.parse(localStorage.getItem(key) || '{}');
      const decrypted = decryptData(stored.value, getEncryptionKey());
      
      // Update lastUsed
      stored.lastUsed = Date.now();
      localStorage.setItem(key, JSON.stringify(stored));
      
      console.log(`[Kibel] 🔑 Pobrano klucz: ${provider} (last used: ${new Date(stored.lastUsed).toLocaleTimeString()})`);
      return decrypted;
    }
  }
  
  console.warn(`[Kibel] ⚠️ Klucz nie znaleziony: ${provider}`);
  return null;
}

/**
 * Pobierz WSZYSTKIE klucze (bez wartości)
 */
export function listKeys(): Omit<KibelKey, 'value'>[] {
  const keys: Omit<KibelKey, 'value'>[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(KIBEL_PREFIX + 'key_')) {
      const stored = JSON.parse(localStorage.getItem(key) || '{}');
      keys.push({
        id: stored.id,
        name: stored.name,
        provider: stored.provider,
        createdAt: stored.createdAt,
        lastUsed: stored.lastUsed,
      });
    }
  }
  
  return keys;
}

/**
 * Usuń klucz z Kibel
 */
export function deleteKey(provider: string, keyId?: string): boolean {
  const prefix = `${KIBEL_PREFIX}key_${provider}`;
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix)) {
      if (keyId && !key.includes(keyId)) continue;
      
      localStorage.removeItem(key);
      console.log(`[Kibel] 🗑️ Usunięto klucz: ${provider}`);
      return true;
    }
  }
  
  return false;
}

/**
 * Wyczyść wszystkie klucze
 */
export function clearKibel(): void {
  const keysToRemove: string[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(KIBEL_PREFIX)) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
  console.log('[Kibel] 🧹 Wyczyszczono wszystkie klucze');
}

/**
 * Sprawdź czy klucz istnieje
 */
export function hasKey(provider: string): boolean {
  const prefix = `${KIBEL_PREFIX}key_${provider}`;
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix)) {
      return true;
    }
  }
  
  return false;
}

/**
 * SPECJALNE: Pobierz Suno Cookie
 */
export function getSunoKey(): string | null {
  return retrieveKey('suno');
}

/**
 * SPECJALNE: Pobierz Gemini API Key
 */
export function getGeminiKey(): string | null {
  return retrieveKey('gemini');
}

/**
 * SPECJALNE: Zapisz Suno Cookie
 */
export function setSunoKey(cookie: string): void {
  storeKey({
    id: crypto.randomUUID(),
    name: 'Suno Production',
    provider: 'suno',
    value: cookie,
    createdAt: Date.now(),
    lastUsed: Date.now(),
  });
}
