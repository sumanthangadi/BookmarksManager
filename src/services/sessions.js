import { databases, APPWRITE_DATABASE_ID, APPWRITE_SESSIONS_COLLECTION_ID, Query } from '../lib/appwrite';
import { ID } from 'appwrite';

const COLLECTION_ID = APPWRITE_SESSIONS_COLLECTION_ID;

export const SessionsService = {
  /**
   * Fetch all saved sessions for a user, newest first.
   * @param {string} userId
   * @returns {Promise<object[]>}
   */
  async fetchSessions(userId) {
    if (!userId) return [];
    try {
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        COLLECTION_ID,
        [
          Query.equal('userId', userId),
          Query.orderDesc('createdAt'),
          Query.limit(100)
        ]
      );
      return response.documents;
    } catch (e) {
      console.error('[SessionsService] Failed to fetch sessions:', e);
      return [];
    }
  },

  /**
   * Save a new session.
   * @param {string} userId
   * @param {string} sessionName
   * @param {Array<{title: string, url: string, favicon: string}>} tabs
   * @returns {Promise<object|null>}
   */
  async saveSession(userId, sessionName, tabs) {
    if (!userId) throw new Error('User ID is missing. Please log in.');
    if (!sessionName) throw new Error('Session name is missing.');
    try {
      const doc = await databases.createDocument(
        APPWRITE_DATABASE_ID,
        COLLECTION_ID,
        ID.unique(),
        {
          userId,
          sessionName,
          tabs: JSON.stringify(tabs),
          createdAt: new Date().toISOString()
        },
        [] // No document-level permissions — collection-level perms handle access
      );
      return doc;
    } catch (e) {
      console.error('[SessionsService] Failed to save session:', e);
      throw e;
    }
  },

  /**
   * Delete a saved session by document ID.
   * @param {string} documentId
   * @returns {Promise<boolean>}
   */
  async deleteSession(documentId) {
    if (!documentId) return false;
    try {
      await databases.deleteDocument(
        APPWRITE_DATABASE_ID,
        COLLECTION_ID,
        documentId
      );
      return true;
    } catch (e) {
      console.error('[SessionsService] Failed to delete session:', e);
      throw e;
    }
  }
};
