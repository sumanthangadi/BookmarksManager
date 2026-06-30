// Background service worker — receives messages from web app and manages storage
chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
  if (request.type === 'SET_JWT' && request.jwt) {
    // Store the JWT and also seed the persistent auth record
    const userData = {
      $id: request.userId,
      email: request.email,
      name: request.name,
    };

    chrome.storage.local.get('folio_auth', (stored) => {
      const existingAuth = stored.folio_auth || {};
      const toSet = {
        appwrite_jwt: request.jwt,
        folio_auth: {
          user: userData,
          trialStatus: existingAuth.trialStatus || null,
        }
      };
      if (request.session) {
        toSet.appwrite_session = request.session;
      }
      chrome.storage.local.set(toSet, () => {
        console.log('[Background] JWT + auth record stored');
        sendResponse({ ok: true });
      });
    });
    return true;
  }

  if (request.type === 'PAYMENT_SUCCESS') {
    // Mark user as paid in the persistent auth record so they never get logged out
    chrome.storage.local.get('folio_auth', (stored) => {
      const auth = stored.folio_auth || {};
      chrome.storage.local.set({
        folio_auth: {
          ...auth,
          trialStatus: { ...(auth.trialStatus || {}), paid: true },
        },
        login_event: Date.now(),
      }, () => {
        console.log('[Background] Payment success — user marked as paid');
        sendResponse({ ok: true });
      });
    });
    return true;
  }

  if (request.type === 'LOGIN_SUCCESS') {
    chrome.storage.local.set({ login_event: Date.now() });
    sendResponse({ ok: true });
  }
});
