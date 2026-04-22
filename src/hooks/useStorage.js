import { useState, useEffect, useCallback } from 'react';
import { getStorageData, setStorageData } from '../utils/storage';

/**
 * Hook to sync a single key with chrome.storage.local.
 * @param {string} key - Storage key
 * @param {*} defaultValue - Default value if nothing stored
 * @returns {[value, setValue, loading]}
 */
export function useStorage(key, defaultValue) {
  const [value, setValue] = useState(defaultValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getStorageData([key]).then((result) => {
      if (!cancelled && result[key] !== undefined) {
        setValue(result[key]);
      }
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [key]);

  const setAndStore = useCallback(
    (newValue) => {
      const resolved = typeof newValue === 'function' ? newValue(value) : newValue;
      setValue(resolved);
      setStorageData({ [key]: resolved });
    },
    [key, value]
  );

  return [value, setAndStore, loading];
}
