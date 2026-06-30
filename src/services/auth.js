import { account, databases, APPWRITE_DATABASE_ID, APPWRITE_USERS_COLLECTION_ID } from '../lib/appwrite';
import { ID } from 'appwrite';

export const AuthService = {
  // Check if session exists
  async getSession() {
    try {
      const session = await account.getSession('current');
      return session;
    } catch (e) {
      return null;
    }
  },

  // Get current logged-in user details
  async getCurrentUser() {
    try {
      const user = await account.get();
      return user;
    } catch (e) {
      try {
        const { logDebug } = await import('../utils/debug');
        await logDebug(`[AuthService] getCurrentUser failed: ${e.message || e}`);
      } catch (_) {}
      return null;
    }
  },

  // Redirect to the web app for login
  async loginWithGoogle() {
    // Open the web app login page in a new tab
    // We pass a source=extension param so the web app knows to notify us on success
    const domain = import.meta.env.DEV ? 'http://localhost:5173' : 'https://www.getfolio.tech';
    const extId = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id ? chrome.runtime.id : '';
    const webLoginUrl = `${domain}/login?source=extension${extId ? `&extId=${extId}` : ''}`;
    window.open(webLoginUrl, '_blank');
  },

  // Logout
  async logout() {
    try {
      await account.deleteSession('current');
      return true;
    } catch (e) {
      return false;
    }
  },

  // Sync user to Appwrite Database on first login
  async syncUserToDB(appwriteUser) {
    if (!appwriteUser) return;
    
    try {
      // Check if user document already exists
      try {
        await databases.getDocument(
          APPWRITE_DATABASE_ID,
          APPWRITE_USERS_COLLECTION_ID,
          appwriteUser.$id
        );
        // If it exists, we're done
        return;
      } catch (e) {
        // Document doesn't exist (404), create it
        if (e.code === 404) {
          await databases.createDocument(
            APPWRITE_DATABASE_ID,
            APPWRITE_USERS_COLLECTION_ID,
            appwriteUser.$id, // Use same ID for easy lookup
            {
              email: appwriteUser.email,
              trial_start: new Date().toISOString(),
              paid: false
            }
          );
        } else {
          throw e;
        }
      }
    } catch (e) {
      console.error('Error syncing user to DB:', e);
    }
  }
};
