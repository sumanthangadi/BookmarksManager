import { databases, APPWRITE_DATABASE_ID, Query } from '../lib/appwrite';

const COLLECTION_ID = 'dashboards';

export const SyncService = {
  /**
   * Fetch user's dashboard document from Appwrite
   * @param {string} userId 
   * @returns {Promise<object|null>}
   */
  async fetchCloudDashboard(userId) {
    if (!userId) return null;
    try {
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        COLLECTION_ID,
        [Query.equal('userId', userId)]
      );
      if (response.total > 0) {
        return response.documents[0];
      }
      return null;
    } catch (e) {
      console.error('[SyncService] Failed to fetch cloud dashboard:', e);
      return null;
    }
  },

  /**
   * Upsert user's dashboard document in Appwrite
   * @param {string} userId 
   * @param {object} dashboardData { sections, bookmarks, sectionIcons }
   * @returns {Promise<object|null>}
   */
  async saveCloudDashboard(userId, dashboardData) {
    if (!userId) return null;
    const payload = {
      userId,
      data: JSON.stringify(dashboardData),
      updatedAt: new Date().toISOString()
    };

    try {
      const existing = await this.fetchCloudDashboard(userId);
      if (existing) {
        return await databases.updateDocument(
          APPWRITE_DATABASE_ID,
          COLLECTION_ID,
          existing.$id,
          payload
        );
      } else {
        return await databases.createDocument(
          APPWRITE_DATABASE_ID,
          COLLECTION_ID,
          'unique()',
          payload
        );
      }
    } catch (e) {
      console.error('[SyncService] Failed to save cloud dashboard:', e);
      throw e;
    }
  }
};
