export async function logDebug(msg, extra = null) {
  console.log(msg, extra || '');
  if (typeof chrome !== 'undefined' && chrome.storage) {
    try {
      const res = await chrome.storage.local.get('folio_debug_logs');
      const logs = res.folio_debug_logs || [];
      const timestamp = new Date().toLocaleTimeString();
      logs.push(`${timestamp}: ${msg} ${extra ? JSON.stringify(extra) : ''}`);
      await chrome.storage.local.set({ folio_debug_logs: logs.slice(-150) }); // Keep last 155 entries
    } catch (e) {}
  }
}
