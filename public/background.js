// Background service worker — receives messages from web app and manages storage
chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
  if (request.type === 'SET_JWT' && request.jwt) {
    chrome.storage.local.set({
      appwrite_jwt: request.jwt,
      appwrite_user: {
        userId: request.userId,
        email: request.email,
        name: request.name,
      }
    }, () => {
      console.log('[Background] JWT stored successfully');
      sendResponse({ ok: true });
    });
    return true;
  }

  if (request.type === 'PAYMENT_SUCCESS') {
    // Clear cached trial so extension re-fetches paid status from DB
    chrome.storage.local.remove(['cached_trial'], () => {
      // Set a flag to trigger re-init in the newtab page
      chrome.storage.local.set({ login_event: Date.now() });
      console.log('[Background] Payment success — cleared trial cache');
      sendResponse({ ok: true });
    });
    return true;
  }

  if (request.type === 'LOGIN_SUCCESS') {
    chrome.storage.local.set({ login_event: Date.now() });
    sendResponse({ ok: true });
  }
});


