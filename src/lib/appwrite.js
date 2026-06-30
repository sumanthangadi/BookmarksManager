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
    console.log('[Appwrite] Session hash applied via client.setSession()');
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
        return true;
      }
    } catch (_) {}
  }

  // 2. Fallback: try reading session cookie (works in Chrome, not Brave)
  if (typeof chrome !== 'undefined' && chrome.cookies) {
    return new Promise((resolve) => {
      chrome.cookies.get({
        url: 'https://fra.cloud.appwrite.io',
        name: `a_session_${APPWRITE_PROJECT_ID}`
      }, (cookie) => {
        if (cookie && cookie.value) {
          console.log('[Appwrite] Found active session cookie. Applying fallback headers...');
          client.headers['X-Fallback-Cookies'] = `a_session_${APPWRITE_PROJECT_ID}=${cookie.value}`;
          resolve(true);
        } else {
          console.log('[Appwrite] No session hash or cookie found.');
          resolve(false);
        }
      });
    });
  }

  return false;
}

