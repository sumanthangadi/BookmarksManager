import { databases, APPWRITE_DATABASE_ID, APPWRITE_USERS_COLLECTION_ID } from '../lib/appwrite';
import { Query } from 'appwrite';

export const PricingService = {
  // Check if user is eligible for launch pricing (<= 100 paid users)
  // And fetch the user's trial/paid status from DB
  async getUserStatus(userId) {
    if (!userId) return null;
    
    try {
      // 1. Get user document
      const userDoc = await databases.getDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_USERS_COLLECTION_ID,
        userId
      );

      // 2. Calculate trial days
      const trialStart = new Date(userDoc.trial_start).getTime();
      const daysElapsed = (Date.now() - trialStart) / (1000 * 60 * 60 * 24);
      const trialActive = daysElapsed < 30;
      const daysRemaining = Math.max(0, Math.ceil(30 - daysElapsed));

      // 3. Check total paid users to determine current price
      let isLaunchPrice = false;
      
      // We only need to check this if they haven't paid yet
      if (!userDoc.paid) {
        // Count users where paid = true
        // Appwrite requires an index on 'paid' for this query to work
        try {
          const paidUsersList = await databases.listDocuments(
            APPWRITE_DATABASE_ID,
            APPWRITE_USERS_COLLECTION_ID,
            [
              Query.equal('paid', true),
              Query.limit(101) // We only care if it's over 100
            ]
          );
          
          isLaunchPrice = paidUsersList.total < 100;
        } catch (e) {
          // Fallback if index isn't ready
          console.warn('Could not count paid users, defaulting to launch price', e);
          isLaunchPrice = true; 
        }
      }

      return {
        paid: userDoc.paid,
        trialActive,
        daysRemaining,
        userEmail: userDoc.email,
        isLaunchPrice,
        price: isLaunchPrice ? 119 : 299
      };
      
    } catch (e) {
      console.error('Error fetching user status:', e);
      return null;
    }
  }
};
