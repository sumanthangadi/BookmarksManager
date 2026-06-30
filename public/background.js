// Background service worker — receives messages from web app and manages storage
const logDebug = (msg, extra = null) => {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    try {
      chrome.storage.local.get('folio_debug_logs', (res) => {
        const logs = res.folio_debug_logs || [];
        const timestamp = new Date().toLocaleTimeString();
        logs.push(`${timestamp}: [Background Page] ${msg} ${extra ? JSON.stringify(extra) : ''}`);
        chrome.storage.local.set({ folio_debug_logs: logs.slice(-150) });
      });
    } catch (e) {}
  }
};

chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
  if (request.type === 'SET_JWT' && request.jwt) {
    logDebug('Received SET_JWT from web app', {
      hasSession: !!request.session,
      userId: request.userId,
      email: request.email
    });

    const userData = {
      $id: request.userId,
      email: request.email,
      name: request.name,
    };

    chrome.storage.local.get('folio_auth', (stored) => {
      const existingAuth = stored.folio_auth || {};
      const payload = {
        appwrite_jwt: request.jwt,
        folio_auth: {
          user: userData,
          trialStatus: existingAuth.trialStatus || null,
        }
      };
      
      if (request.session) {
        payload.appwrite_session = request.session;
      }

      chrome.storage.local.set(payload, () => {
        logDebug('Stored JWT, session hash, and user data to storage');
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
