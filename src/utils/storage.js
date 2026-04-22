/**
 * Chrome Storage utility with localStorage fallback for development.
 */

const isExtension = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;

/**
 * Get data from storage.
 * @param {string|string[]} keys - Key(s) to retrieve
 * @returns {Promise<object>} Stored data
 */
export const getStorageData = (keys) => {
  return new Promise((resolve) => {
    if (isExtension) {
      chrome.storage.local.get(keys, (result) => {
        resolve(result);
      });
    } else {
      // LocalStorage fallback for dev mode
      const result = {};
      const keyArray = Array.isArray(keys) ? keys : [keys];
      keyArray.forEach((key) => {
        const stored = localStorage.getItem(`bm_${key}`);
        if (stored) {
          try {
            result[key] = JSON.parse(stored);
          } catch {
            result[key] = stored;
          }
        }
      });
      resolve(result);
    }
  });
};

/**
 * Save data to storage.
 * @param {object} data - Key-value pairs to store
 * @returns {Promise<void>}
 */
export const setStorageData = (data) => {
  return new Promise((resolve) => {
    if (isExtension) {
      chrome.storage.local.set(data, () => {
        resolve();
      });
    } else {
      Object.entries(data).forEach(([key, value]) => {
        localStorage.setItem(`bm_${key}`, JSON.stringify(value));
      });
      resolve();
    }
  });
};

/**
 * Clear all stored data.
 * @returns {Promise<void>}
 */
export const clearStorage = () => {
  return new Promise((resolve) => {
    if (isExtension) {
      chrome.storage.local.clear(() => {
        resolve();
      });
    } else {
      Object.keys(localStorage)
        .filter((key) => key.startsWith('bm_'))
        .forEach((key) => localStorage.removeItem(key));
      resolve();
    }
  });
};
