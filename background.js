// ============================================
// GA4 Analytics Configuration
// ============================================
const GA4_MEASUREMENT_ID = 'G-0BYNWSVBWY';
const GA4_API_SECRET = 'PcU4kGVMQVa-ScarRQkiaQ';

// Send event to GA4 via Measurement Protocol
async function sendEvent(eventName, parameters = {}) {
  const payload = {
    measurement_id: GA4_MEASUREMENT_ID,
    event_name: eventName,
    parameters: {
      ...parameters,
      engagement_time_msec: '100',
      session_id: await getSessionId()
    }
  };

  try {
    await fetch(`https://www.google-analytics.com/mp/collect?measurement_id=${GA4_MEASUREMENT_ID}&api_secret=${GA4_API_SECRET}`, {
      method: 'POST',
      body: JSON.stringify({
        client_id: await getClientId(),
        events: [{
          name: eventName,
          params: payload.parameters
        }]
      })
    });
  } catch (error) {
    console.error('GA4 tracking error:', error);
  }
}

// Get or create client ID
async function getClientId() {
  const result = await chrome.storage.local.get(['gaClientId']);
  if (!result.gaClientId) {
    const clientId = crypto.randomUUID();
    await chrome.storage.local.set({ gaClientId: clientId });
    return clientId;
  }
  return result.gaClientId;
}

// Session ID
async function getSessionId() {
  const result = await chrome.storage.local.get(['gaSessionId', 'gaSessionStart']);
  const now = Date.now();
  const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  if (!result.gaSessionId || !result.gaSessionStart || (now - result.gaSessionStart > SESSION_TIMEOUT)) {
    const sessionId = now;
    await chrome.storage.local.set({ gaSessionId: sessionId, gaSessionStart: now });
    return sessionId;
  }
  return result.gaSessionId;
}

// Track extension install
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    sendEvent('extension_install');
  }
});

// Listen for analytics events from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'trackEvent') {
    sendEvent(request.eventName, request.parameters);
    return true;
  }

  // Handle premium activation
  if (request.action === 'activatePremium') {
    (async () => {
      try {
        const premiumUntil = new Date();
        premiumUntil.setDate(premiumUntil.getDate() + 30);

        await chrome.storage.local.set({
          premiumUntil: premiumUntil.toISOString()
        });

        sendResponse({ success: true });
      } catch (err) {
        console.error('Error activating premium:', err);
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }
});

// ============================================
// Medium to Freedium Redirect Logic
// ============================================
const mediumBaseDomains = [
  'medium.com',
  'generativeai.pub',
  'towardsdatascience.com',
  'bettermarketing.pub',
  'bootcamp.uxdesign.cc',
  'plainenglish.io'
];

// Функция для обновления счетчика
async function updateCounter(url) {
  try {
    const today = new Date().toISOString().split('T')[0];

    const result = await chrome.storage.local.get(['articleStats']);
    let stats = result.articleStats || {};

    if (!stats[today]) {
      stats[today] = {
        count: 0,
        articles: []
      };
    }

    if (!stats[today].articles.includes(url)) {
      stats[today].count++;
      stats[today].articles.push(url);

      await chrome.storage.local.set({ articleStats: stats });

      return stats[today].count;
    }

    return stats[today].count;
  } catch (err) {
    console.error('Error updating counter:', err);
    return null;
  }
}

// Функция для проверки премиум-статуса
async function checkPremiumStatus() {
  const result = await chrome.storage.local.get(['premiumUntil']);
  if (!result.premiumUntil) return false;

  return new Date(result.premiumUntil) > new Date();
}

// Обновляем существующий listener
chrome.webNavigation.onCompleted.addListener(async (details) => {
  try {
    const url = new URL(details.url);

    // Пропускаем главную страницу medium.com
    if (url.hostname === 'medium.com' && url.pathname === '/') {
      return;
    }

    // Пропускаем если это уже freedium
    if (url.hostname === 'freedium-mirror.cfd') {
      return;
    }

    // Проверяем премиум-статус
    const isPremium = await checkPremiumStatus();

    if (mediumBaseDomains.some(domain =>
      url.hostname === domain ||
      url.hostname.endsWith('.' + domain)
    )) {
      const freediumUrl = `https://freedium-mirror.cfd${url.pathname}${url.search}`;

      // Premium users get the banner too - user choice is important
      // if (isPremium) {
      //   await sendEvent('redirect_success', { url: freediumUrl });
      //   chrome.tabs.update(details.tabId, { url: freediumUrl });
      //   return;
      // }

      // Show mirror options to user - let them decide
      const currentCount = await updateCounter(details.url);
      chrome.tabs.sendMessage(details.tabId, {
        action: 'showMirrorOptions',
        freediumUrl: freediumUrl,
        articlesCount: currentCount,
        isPremium: false
      });
    }
  } catch (err) {
    console.error('Error in navigation handler:', err);
  }
});
