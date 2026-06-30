import { databases, APPWRITE_DATABASE_ID, APPWRITE_SESSIONS_COLLECTION_ID, Query } from '../lib/appwrite';
import { ID } from 'appwrite';
import { logDebug } from '../utils/debug';

const COLLECTION_ID = APPWRITE_SESSIONS_COLLECTION_ID;

export const SessionsService = {
  /**
   * Fetch all saved sessions for a user, newest first.
   * @param {string} userId
   * @returns {Promise<object[]>}
   */
  async fetchSessions(userId) {
    if (!userId) {
      await logDebug('[SessionsService] fetchSessions cancelled: userId is empty');
      return [];
    }
    try {
      await logDebug(`[SessionsService] fetchSessions initiated for user: ${userId}`);
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        COLLECTION_ID,
        [
          Query.equal('userId', userId),
          Query.orderDesc('createdAt'),
          Query.limit(100)
        ]
      );
      await logDebug(`[SessionsService] fetchSessions success. Found ${response.documents.length} sessions`);
      return response.documents;
    } catch (e) {
      await logDebug(`[SessionsService] fetchSessions failed. Error: ${e.message || e}`);
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
      await logDebug(`[SessionsService] saveSession starting for user ${userId}, sessionName: ${sessionName}, tabs: ${tabs.length}`);
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
      await logDebug(`[SessionsService] saveSession document created successfully: ${doc.$id}`);
      return doc;
    } catch (e) {
      await logDebug(`[SessionsService] saveSession database error: ${e.message || e}`);
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
      await logDebug(`[SessionsService] deleteSession starting for doc: ${documentId}`);
      await databases.deleteDocument(
        APPWRITE_DATABASE_ID,
        COLLECTION_ID,
        documentId
      );
      await logDebug(`[SessionsService] deleteSession success for doc: ${documentId}`);
      return true;
    } catch (e) {
      await logDebug(`[SessionsService] deleteSession failed for doc: ${documentId}. Error: ${e.message || e}`);
      console.error('[SessionsService] Failed to delete session:', e);
      throw e;
    }
  }
};
