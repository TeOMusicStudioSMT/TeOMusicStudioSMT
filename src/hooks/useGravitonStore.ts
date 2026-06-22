import { useState, useEffect } from 'react';

// 3. SKARBIEC MODUŁÓW GRV (Licencjonowanie przez moc obliczeniową)
export interface ModuleGate {
  id: 'music' | 'video' | 'lab';
  requiredGRV: number;
  isUnlocked: boolean;
}

// Lokalny Kwantowy Implant Pamięci (useLocalStorage)
function useLocalStorage<T>(key: string, defaultValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn(`[useLocalStorage] Błąd odczytu klucza ${key}:`, error);
      return defaultValue;
    }
  });

  const setValue = (value: T | ((prev: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`[useLocalStorage] Błąd zapisu klucza ${key}:`, error);
    }
  };

  return [storedValue, setValue];
}

const bridgeService = {
  executeAction: async (action: string, payload: any) => {
    try {
      const response = await fetch('http://127.0.0.1:3001/wiesio/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload })
      });
      return await response.json();
    } catch (e) {
      console.error(`[bridgeService] Błąd akcji ${action}:`, e);
      return { success: false, error: String(e) };
    }
  }
};

export const useGravitonStore = () => {
  const [grvBalance, setGrvBalance] = useLocalStorage<number>('teodash_grv_balance', 0.00);
  const [unlockedModules, setUnlockedModules] = useState<string[]>([]);

  // Pobranie aktualnie odblokowanych modułów z mostka
  const refreshUnlockedModules = async () => {
    try {
      const data = await bridgeService.executeAction('GET_UNLOCKED_PIPELINES', {});
      if (data.success && data.unlocked) {
        setUnlockedModules(data.unlocked);
      }
    } catch (err) {
      console.warn('[useGravitonStore] Błąd synchronizacji ze skarbcem:', err);
    }
  };

  useEffect(() => {
    refreshUnlockedModules();
  }, []);

  const unlockModule = async (moduleId: string, cost: number) => {
    if (grvBalance >= cost) {
      setGrvBalance((prev: number) => prev - cost);
      // Wiesio-bridge zdejmuje blokadę i aktywuje port lokalny!
      const data = await bridgeService.executeAction('UNLOCK_MODULE_PIPELINE', { moduleId });
      if (data.success && data.unlocked) {
        setUnlockedModules(data.unlocked);
        return { success: true, message: data.message };
      }
      return { success: false, error: data.error || 'Błąd odblokowania na mostku' };
    } else {
      return { success: false, error: `Niewystarczająca ilość GRV. Wymagane: ${cost}, posiadasz: ${grvBalance}` };
    }
  };

  const isModuleUnlocked = (moduleId: string) => {
    return unlockedModules.includes(moduleId);
  };

  return {
    grvBalance,
    setGrvBalance,
    unlockModule,
    isModuleUnlocked,
    refreshUnlockedModules,
    unlockedModules
  };
};
