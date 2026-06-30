import { Client, Account, Databases, Query } from 'appwrite';

const APPWRITE_ENDPOINT = 'https://fra.cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = '6a007fab00241e1b5379';

export const APPWRITE_DATABASE_ID = '6a008029003309693066';
export const APPWRITE_USERS_COLLECTION_ID = 'users';
export const APPWRITE_SESSIONS_COLLECTION_ID = 'sessions';

export const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID);

export const account = new Account(client);
export const databases = new Databases(client);
export { Query };

// Call this to authenticate the extension with a JWT from the web app
export function setClientJWT(jwt) {
  client.setJWT(jwt);
}

// Authenticate using the long-lived session hash (no cookies needed)
export function setClientSession(sessionHash) {
  if (sessionHash) {
    client.setSession(sessionHash);
    client.headers['X-Fallback-Cookies'] = `a_session_${APPWRITE_PROJECT_ID}=${sessionHash}`;
    console.log('[Appwrite] Session hash applied via client.setSession() and X-Fallback-Cookies');
    return true;
  }
  return false;
}

// Try to restore auth from stored session hash, then fallback to cookies
export async function refreshAppwriteSession() {
  // 1. Try stored session hash from chrome.storage.local
  if (typeof chrome !== 'undefined' && chrome.storage) {
    try {
      const stored = await chrome.storage.local.get('appwrite_session');
      if (stored.appwrite_session) {
        console.log('[Appwrite] Found stored session hash. Applying...');
        client.setSession(stored.appwrite_session);
        client.headers['X-Fallback-Cookies'] = `a_session_${APPWRITE_PROJECT_ID}=${stored.appwrite_session}`;
        return true;
      }
    } catch (_) {}
  }

  // 2. Fallback: try reading session cookie (works in Chrome, not Brave unless using partitionKey)
  if (typeof chrome !== 'undefined' && chrome.cookies) {
    return new Promise((resolve) => {
      const getCookies = (params) => {
        return new Promise((res) => {
          try {
            chrome.cookies.getAll(params, (list) => {
              res(list || []);
            });
          } catch (e) {
            console.warn('[Appwrite] chrome.cookies.getAll failed with params:', params, e);
            res([]);
          }
        });
      };

      (async () => {
        // Try getting cookies from all partitions first
        let list = await getCookies({
          name: `a_session_${APPWRITE_PROJECT_ID}`,
          partitionKey: {}
        });

        // If no cookies found, try without partitionKey
        if (list.length === 0) {
          list = await getCookies({
            name: `a_session_${APPWRITE_PROJECT_ID}`
          });
        }

        const cookie = list[0];
        if (cookie && cookie.value) {
          console.log('[Appwrite] Found active session cookie. Applying fallback headers...');
          client.setSession(cookie.value);
          client.headers['X-Fallback-Cookies'] = `a_session_${APPWRITE_PROJECT_ID}=${cookie.value}`;
          // Persist the cookie value in local storage as a session hash
          try {
            chrome.storage.local.set({ appwrite_session: cookie.value });
            console.log('[Appwrite] Persisted session cookie value to local storage');
          } catch (_) {}
          resolve(true);
        } else {
          console.log('[Appwrite] No session hash or cookie found.');
          resolve(false);
        }
      })();
    });
  }

  return false;
}

